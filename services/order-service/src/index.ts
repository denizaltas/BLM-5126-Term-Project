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

  if (!token) return res.status(401).json({ error: "Token bulunamadı." });

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Token geçersiz veya süresi dolmuş!" });
    req.user = user;
    next();
  });
};

app.get('/orders', async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({ include: { items: true } });
  res.json(orders);
});

app.get('/my-orders', authenticateToken, async (req: any, res: any) => {
  try {
    const user = req.user; 
    const orders = await prisma.order.findMany({
      where: { userEmail: user.email },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Siparişleriniz yüklenemedi!" });
  }
});

app.get('/admin/orders', async (req, res) => {
  try {
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: "Siparişler yüklenemedi" });
  }
});

app.patch('/admin/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Update başarısız oldu" });
  }
});

app.patch('/admin/orders/:id/refund', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order || order.status !== 'PAID') {
      return res.status(400).json({ error: "Yalnızca PAID ürünlere ücret iadesi yapılabilir" });
    }
    await axios.post('http://localhost:3005/refund', { orderId: order.id, amount: order.total });
    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: 'REFUNDED' }
    });
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: "Ücret iadesi başarısız oldu" });
  }
});

app.post('/orders', authenticateToken, async (req: any, res: any) => {
  try {
    const { items } = req.body;
    const user = req.user;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sepetiniz boş!' });
    }

    let calculatedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const currentIsbn = item.bookIsbn || item.isbn;
      if (!currentIsbn) {
        return res.status(400).json({ error: 'Geçersiz ürün verisi (ISBN eksik)!' });
      }

      try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/${currentIsbn}`);
        const product = response.data;

        if (product.stock < item.quantity) {
          return res.status(400).json({ error: `${product.title} stokta yeterli değil!` });
        }

        const realPrice = Number(product.price);
        calculatedTotal += realPrice * item.quantity;

        verifiedItems.push({
          bookIsbn: currentIsbn,
          title: product.title,
          quantity: item.quantity,
          price: realPrice
        });
      } catch (error) {
        console.error(`Product Service Hatası: ISBN ${currentIsbn}:`, error);
        return res.status(404).json({ error: `Ürün bulunamadı: ${currentIsbn}` });
      }
    }

    const newOrder = await prisma.order.create({
      data: {
        userFirstName: user.name || "Customer",
        userLastName: "",
        userEmail: user.email,
        total: calculatedTotal,
        status: "PENDING",
        items: { create: verifiedItems }
      },
      include: { items: true }
    });

    publishOrderEvent(newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Order Oluşturma hatası:", error);
    res.status(500).json({ error: 'Sipariş oluşturulamadı!' });
  }
});

app.patch('/orders/:id/pay', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: 'PAID' } 
    });
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: "Sipariş bulunamadı" });
  }
});

// RabbitMQ Publisher
async function publishOrderEvent(order: any) {
  try {
    const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    const channel = await connection.createChannel();
    
    const exchange = 'order_exchange';
    const message = JSON.stringify({
      id: order.id,
      userEmail: order.userEmail,
      total: order.total,
      items: order.items.map((item: any) => ({
        isbn: item.bookIsbn,
        title: item.title,
        quantity: item.quantity
      }))
    });

    await channel.assertExchange(exchange, 'fanout', { durable: true });
    channel.publish(exchange, '', Buffer.from(message), { persistent: true });
    
    console.log("🐇 Event Published to Queue:", message);

    setTimeout(() => { connection.close(); }, 500);
  } catch (error) {
    console.error("RabbitMQ Hatası:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});