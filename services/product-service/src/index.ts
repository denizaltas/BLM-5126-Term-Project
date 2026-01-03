import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import amqp from 'amqplib';

const app = express();
const prisma = new PrismaClient();
const PORT = 3002;

app.use(express.json());
app.use(cors());

// GET Books
app.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await prisma.book.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Kitapları getirmekte sorun var!' });
  }
});

// POST Book
// Yeni kitap eklemek (yalnızca admin için)
app.post('/products', async (req: Request, res: Response) => {
  try {
    const { isbn, title, author, genre, price, stock } = req.body;
    
    const newBook = await prisma.book.create({
      data: {
        isbn,
        title,
        author,
        genre,
        price,
        stock
      }
    });
    
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Kitap oluşturulamadı!' });
  }
});

// ID ile tek bir kitap GET yapmak için
app.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.book.findUnique({
      where: { isbn: id }
    });
    
    if (!product) {
      res.status(404).json({ error: 'Kitap bulunamadı!' });
      return;
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'İstenilen kitap getirilemedi!' });
  }
});

async function subscribeToOrders() {
  try {
    const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    const channel = await connection.createChannel();
    const queue = 'order_created';

    await channel.assertQueue(queue, { durable: false });

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const orderItems = JSON.parse(msg.content.toString());

        // Ürünlerin stok miktarını düzenlemek için
        for (const item of orderItems) {
          try {
            await prisma.book.update({
              where: { isbn: item.isbn },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
            console.log(`Ürünün stok sayısı değiştirildi: ${item.isbn}: -${item.quantity}`);
          } catch (error) {
            console.error(`Stok sayısı değiştirilemedi: ${item.isbn}`, error);
          }
        }

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("RabbitMQ bağlantısı kurulamadı:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
  subscribeToOrders();
});