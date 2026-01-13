import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = 3004;
const SECRET_KEY = process.env.JWT_SECRET || "secretkey";

app.use(express.json());
app.use(cors());

app.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Kullanıcı sistemde kayıtlı!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || "CUSTOMER"
      }
    });

    res.status(201).json({ 
      message: "Kullanıcı başarıyla oluşturuldu!", 
      userId: user.id,
      role: user.role 
    });

  } catch (error) {
    console.error("Hata:", error);
    res.status(500).json({ error: "Kayıt sırasında bir hata oluştu." });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email doğru mu diye kontrol et
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
       res.status(400).json({ error: "Email veya parola hatalı!" });
       return;
    }

    // Parola doğru mu diye kontrol et
    // Hangisinin yanlış olduğu önemli değil aynı hatayı döndür
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
       res.status(400).json({ error: "Email veya parola hatalı!" });
       return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.firstName }, 
      SECRET_KEY, 
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role, email: user.email, name: user.firstName });

  } catch (error) {
    console.error("Giriş başarısız:", error);
    res.status(500).json({ error: "Giriş başarısız oldu." });
  }
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});