import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const ORDER_SERVICE_URL = 'http://localhost:3003';

app.post('/process-payment', async (req: Request, res: Response) => {
  const { orderId, amount, cardDetails } = req.body;
  const cleanCardNumber = cardDetails.number.replace(/\s/g, '');

  try {
    const card = await prisma.validCard.findUnique({
      where: { cardNumber: cleanCardNumber }
    });

    if (!card || card.cvv !== cardDetails.cvv) {
      return res.status(400).json({ success: false, message: "Kart bilgileri yanlış" });
    }

    if (Number(card.balance) < Number(amount)) {
      return res.status(400).json({ success: false, message: "Yetersiz Bakiye" });
    }

    await prisma.validCard.update({
      where: { cardNumber: cleanCardNumber }, 
      data: { balance: Number(card.balance) - Number(amount) }
    });

    await prisma.payment.create({
        data: {
            orderId: Number(orderId),
            cardNumber: cleanCardNumber,
            amount: Number(amount),
            status: 'COMPLETED'
        }
    });

    await axios.patch(`${ORDER_SERVICE_URL}/orders/${orderId}/pay`);
    res.json({ success: true, message: "Ödeme Başarılı" });
  } catch (error) {
    console.error("Payment Error:", error); 
    res.status(500).json({ success: false, message: "Server hatası" });
  }
});

app.post('/refund', async (req: Request, res: Response) => {
  const { orderId, amount } = req.body;

  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId: Number(orderId) }
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    await prisma.validCard.update({
      where: { cardNumber: payment.cardNumber },
      data: {
        balance: { increment: Number(amount) }
      }
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' }
    });

    res.json({ message: "Refund processed successfully" });
  } catch (error) {
    console.error("Refund Error:", error);
    res.status(500).json({ error: "Failed to process refund in DB" });
  }
});

app.listen(3005, () => console.log("Payment Service running on 3005"));