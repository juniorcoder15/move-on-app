import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

router.post('/register', async (req: Request, res: Response) => {
  console.log('📝 Register request received:', req.body);
  
  try {
    const { name, email, password, phone, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ===== ITO YUNG TAMANG VALUES (may phone at avatar, at passwordHash) =====
    const newUser = await db.insert(users).values({
      name,
      email,
      passwordHash: hashedPassword,
      phone: phone || '',
      avatar: avatar || '👤',
    }).returning();

    const token = jwt.sign(
      { id: newUser[0].id, email: newUser[0].email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ User registered:', newUser[0].email);
    
    res.status(201).json({
      token,
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        phone: newUser[0].phone,
        avatar: newUser[0].avatar,
        createdAt: newUser[0].createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  console.log('🔐 Login request received:', req.body.email);
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // ===== ITO YUNG TAMANG CHECK: Hanapin ang passwordHash, HINDI password =====
    const user = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatar: users.avatar,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.email, email));
    
    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ===== ITO YUNG TAMANG CHECK: Kung walang passwordHash, mag-error =====
    if (!user[0].passwordHash) {
      return res.status(400).json({ error: 'Password not set for this user' });
    }

    const isValid = await bcrypt.compare(password, user[0].passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user[0].id, email: user[0].email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ User logged in:', user[0].email);
    
    res.json({
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        phone: user[0].phone,
        avatar: user[0].avatar,
        createdAt: user[0].createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;