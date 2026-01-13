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
app.get('/products', async (req, res) => {
  const products = await prisma.book.findMany({
    orderBy: {
      isbn: 'asc'
    }
  });
  res.json(products);
});

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
        price: parseFloat(price), 
        stock: parseInt(stock)
      }
    });
    
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Kitap oluşturulamadı!' });
  }
});

// Kitap update etmek için
app.patch('/products/:isbn', async (req: Request, res: Response) => {
  const { isbn } = req.params;
  const { price, stock } = req.body;
  try {
    const updated = await prisma.book.update({
      where: { isbn },
      data: {
        price: price !== undefined ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Update başarısız oldu" });
  }
});

app.delete('/products/:isbn', async (req, res) => {
  const { isbn } = req.params;
  try {
    await prisma.book.delete({ where: { isbn } });
    res.json({ message: "Kitap stoktan kaldırıldı" });
  } catch (error) {
    res.status(500).json({ error: "Silme işlemi başarısız oldu" });
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
    
    const exchange = 'order_exchange';
    const queue = 'product_stock_queue';

    await channel.assertExchange(exchange, 'fanout', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, '');

    console.log("🛠️ Product Service listening for stock updates...");

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          const itemsToProcess = payload.items; 

          for (const item of itemsToProcess) {
            await prisma.book.update({
              where: { isbn: item.isbn },
              data: { stock: { decrement: item.quantity } }
            });
            console.log(`Stock reduced: ${item.isbn}, Qty: ${item.quantity}`);
          }

          console.log(`Stock updated for Order #${payload.id}`);
          channel.ack(msg);
        } catch (error) {
          console.error("Stok güncelleme hatası:", error);
          channel.ack(msg); 
        }
      }
    });
  } catch (error) {
    console.error("RabbitMQ Bağlantı hatası:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
  subscribeToOrders();
});