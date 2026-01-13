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
    const queue = 'order_created';

    await channel.assertQueue(queue, { durable: true });
    
    console.log("Notification Service is RUNNING");

    channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const order = JSON.parse(msg.content.toString());
          const recipientEmail = order.userEmail;
          

          const rawTotal = order.total;
          const displayTotal = (typeof rawTotal === 'number') 
            ? rawTotal.toFixed(2) 
            : Number(rawTotal || 0).toFixed(2);

          console.log(`Sipariş #${order.id} alındı. Email gönderiliyor...`);

          await transporter.sendMail({
            from: '"GoodReads Team" <admin@goodreads.com>',
            to: recipientEmail,
            subject: `Sipariş Onayı: #${order.id}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Siparişiniz Alındı!</h2>
                <p>Sipariş No: <b>#${order.id}</b></p>
                <p>Toplam Tutar: <b>$${displayTotal}</b></p>
                <p>Teşekkür ederiz!</p>
              </div>
            `,
          });

          console.log(`#${order.id} nolu sipariş için email gönderildi`);
          channel.ack(msg); 

        } catch (error) {
          console.error("Notification servis hatası:", error);
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