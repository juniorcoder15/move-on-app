import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// ===== GET ALL USERS =====
router.get('/', async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      phone: users.phone,
      createdAt: users.createdAt,
    }).from(users);
    
    res.json(allUsers);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ===== GET USER BY ID =====
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // ✅ I-check kung string ang id at i-convert to number
    const idParam = req.params.id;
    if (typeof idParam !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const userId = parseInt(idParam, 10);
    
    // ✅ I-check kung valid number
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user[0]);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ===== UPDATE USER (PUT) =====
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (typeof idParam !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const userId = parseInt(idParam, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const { name, phone, avatar } = req.body;
    
    if (!name && !phone && !avatar) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const updatedUser = await db.update(users)
      .set({
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(avatar ? { avatar } : {}),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        phone: users.phone,
        createdAt: users.createdAt,
      });
    
    if (updatedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;