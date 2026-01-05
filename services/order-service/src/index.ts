import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import axios from 'axios';
import amqp from 'amqplib';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = 3003;

app.use(express.json());
app.use(cors());

const SECRET_KEY = "secretkey";

const PRODUCT_SERVICE_URL = 'http://localhost:3002/products';

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Token hatalı!" });
    }
    req.user = user;
    next();
  });
};

// GET ile tüm orderları çekme
app.get('/orders', async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: { items: true }
  });
  res.json(orders);
});

// GET ile kişiye ait orderları çekme
app.get('/my-orders', authenticateToken, async (req: any, res: any) => {
  try {
    const user = req.user; 

    const orders = await prisma.order.findMany({
      where: {
        userEmail: user.email 
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Siparişleriniz yüklenemedi!" });
  }
});

// POST ile order oluşturma
app.post('/orders', authenticateToken, async (req: any, res: any) => {
  try {
    const { items } = req.body;
    const user = req.user;

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
          title: item.title,
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
        userFirstName: user.name,
        userLastName: "",
        userEmail: user.email,
        total: calculatedTotal,
        status: "PENDING",
        items: {
          create: verifiedItems
        }
      },
      include: { items: true }
    });

    publishOrderEvent(verifiedItems);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sipariş oluşturulamadı!' });
  }
});

async function publishOrderEvent(items: any[]) {
  try {
    const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    const channel = await connection.createChannel();
    const queue = 'order_created';

    await channel.assertQueue(queue, { durable: false });

    const message = JSON.stringify(items.map(item => ({
      isbn: item.bookIsbn,
      quantity: item.quantity
    })));

    channel.sendToQueue(queue, Buffer.from(message));
    console.log("🐇 Sent to RabbitMQ:", message);

    setTimeout(() => { connection.close(); }, 500);
  } catch (error) {
    console.error("RabbitMQ Error:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});