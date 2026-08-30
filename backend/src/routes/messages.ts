import { Router, Request, Response } from 'express';
import { db } from '../db';
import { messages } from '../db/schema';
import { eq, or, and } from 'drizzle-orm';

const router = Router();

// ===== GET MESSAGES BETWEEN TWO USERS (BOTH DIRECTIONS) =====
router.get('/:userId1/:userId2', async (req: Request, res: Response) => {
  try {
    const userId1 = parseInt(req.params.userId1 as string, 10);
    const userId2 = parseInt(req.params.userId2 as string, 10);

    if (isNaN(userId1) || isNaN(userId2)) {
      return res.status(400).json({ error: 'Invalid user IDs' });
    }

    const result = await db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.recipientId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.recipientId, userId1)
          )
        )
      )
      .orderBy(messages.createdAt);

    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ===== GET UNREAD MESSAGES (MESSAGE REQUESTS) =====
router.get('/unread/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.recipientId, userId),
          eq(messages.read, 0)
        )
      )
      .orderBy(messages.createdAt);

    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching unread messages:', error);
    res.status(500).json({ error: 'Failed to fetch unread messages' });
  }
});

// ===== MARK MESSAGE AS READ =====
router.put('/read/:messageId', async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId as string, 10);

    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const updated = await db.update(messages)
      .set({ read: 1 })
      .where(eq(messages.id, messageId))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ===== SAVE MESSAGE =====
router.post('/', async (req: Request, res: Response) => {
  try {
    const { senderId, recipientId, message } = req.body;

    if (!senderId || !recipientId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { senderId, recipientId, message }
      });
    }

    const newMessage = await db.insert(messages).values({
      senderId: parseInt(senderId, 10),
      recipientId: parseInt(recipientId, 10),
      message,
      read: 0,
    }).returning();

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('❌ Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

export default router;