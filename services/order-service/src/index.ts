import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import axios from 'axios';

const app = express();
const prisma = new PrismaClient();
const PORT = 3003;

app.use(express.json());
app.use(cors());

const PRODUCT_SERVICE_URL = 'http://localhost:3002/products';

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

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Sepetiniz boş!' });
      return;
    }

    let calculatedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/${item.bookIsbn}`);
        const product = response.data;

        // Stokta yeterli ürün var mı kontrol et
        if (product.stock < item.quantity) {
          res.status(400).json({ error: `${product.title} stokta yok!` });
          return;
        }

        // product-service'ten ürün fiyatını çek
        const realPrice = Number(product.price);
        const lineTotal = realPrice * item.quantity;
        
        calculatedTotal += lineTotal;

        verifiedItems.push({
          bookIsbn: item.bookIsbn,
          quantity: item.quantity,
          price: realPrice
        });

      } catch (error) {
        console.error(`Aradığınız ürün bulunamadı. ISBN: ${item.bookIsbn}`, error);
        return;
      }
    }

    const newOrder = await prisma.order.create({
      data: {
        userFirstName,
        userLastName,
        userEmail,
        total: calculatedTotal,
        status: "PENDING",
        items: {
          create: verifiedItems
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