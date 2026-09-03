import { Router, Request, Response } from 'express';
import { db } from '../db';
import { messages } from '../db/schema';
import { and, or, eq } from 'drizzle-orm';

const router = Router();

// ===== GET MESSAGES BETWEEN TWO USERS (MAY TAMANG SENDER/RECIPIENT CHECK) =====
router.get('/:userId1/:userId2', async (req: Request, res: Response) => {
  try {
    const userId1 = parseInt(req.params.userId1 as string, 10);
    const userId2 = parseInt(req.params.userId2 as string, 10);
    
    if (isNaN(userId1) || isNaN(userId2)) {
      return res.status(400).json({ error: 'Invalid user IDs' });
    }
    
    const conversation = await db.select({
      id: messages.id,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      message: messages.message,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
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
    )
    .orderBy(messages.createdAt);
    
    res.json(conversation);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ===== SAVE MESSAGE =====
router.post('/', async (req: Request, res: Response) => {
  try {
    const { senderId, recipientId, message } = req.body;
    
    if (!senderId || !recipientId || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const savedMessage = await db.insert(messages)
      .values({
        senderId,
        recipientId,
        message,
        is_read: false,
      })
      .returning({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        message: messages.message,
        createdAt: messages.createdAt,
      });
    
    res.json(savedMessage[0]);
  } catch (error) {
    console.error('❌ Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// ===== MARK MESSAGE AS READ =====
router.put('/read/:messageId', async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId as string, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }
    
    await db.update(messages)
      .set({
        is_read: true,
      })
      .where(eq(messages.id, messageId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ===== CLEAR MESSAGES (DELETE CHAT) =====
router.delete('/clear/:userId1/:userId2', async (req: Request, res: Response) => {
  try {
    const userId1 = parseInt(req.params.userId1 as string, 10);
    const userId2 = parseInt(req.params.userId2 as string, 10);
    
    if (isNaN(userId1) || isNaN(userId2)) {
      return res.status(400).json({ error: 'Invalid user IDs' });
    }
    
    await db.delete(messages)
      .where(
        and(
          or(
            eq(messages.senderId, userId1),
            eq(messages.senderId, userId2)
          ),
          or(
            eq(messages.recipientId, userId1),
            eq(messages.recipientId, userId2)
          )
        )
      );
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error clearing messages:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
});

export default router;