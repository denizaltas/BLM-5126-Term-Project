import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
const PORT = 3003;

app.use(express.json());
app.use(cors());

// GET ile orderları çekme
app.get('/orders', async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: { items: true }
  });
  res.json(orders);
});

// POST ile order oluşturma
app.post('/orders', async (req: Request, res: Response) => {
  try {
    const { userFirstName, userLastName, userEmail, items } = req.body;

    let total = 0;
    items.forEach((item: any) => {
      total += item.price * item.quantity;
    });

    const newOrder = await prisma.order.create({
      data: {
        userFirstName,
        userLastName,
        userEmail,
        total,
        status: "PENDING",
        items: {
          create: items
        }
      },
      include: { items: true }
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sipariş oluşturulamadı!' });
  }
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});