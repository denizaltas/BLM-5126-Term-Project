import dotenv from 'dotenv';
dotenv.config();

import amqp from 'amqplib';
import type { ConsumeMessage } from 'amqplib';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER || "", 
    pass: process.env.MAILTRAP_PASS || ""
  }
});

async function startNotificationService() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    
    const exchange = 'order_exchange';
    const queue = 'notification_email_queue';

    await channel.assertExchange(exchange, 'fanout', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, '');

    console.log("Notification Service listening for emails...");

    channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const order = JSON.parse(msg.content.toString());
          const displayTotal = Number(order.total || 0).toFixed(2);

          await transporter.sendMail({
            from: '"GoodReads Team" <admin@goodreads.com>',
            to: order.userEmail,
            subject: `Sipariş Onayı: #${order.id}`,
            html: `<h2>Siparişiniz Alındı!</h2><p>No: #${order.id}</p><p>Toplam: $${displayTotal}</p>`
          });

          console.log(`Email sent for Order #${order.id}`);
          channel.ack(msg); 
        } catch (error) {
          console.error("Email hatası:", error);
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.error("RabbitMQ Hatası:", error);
  }
}

transporter.verify((error) => {
  if (error) console.error("Mailtrap Auth Hatası!", error);
  else console.log("Mailtrap is running...");
});

startNotificationService();