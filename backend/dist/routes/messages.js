"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
// ===== GET UNREAD MESSAGES (ITO DAPAT NASA UNA!) =====
router.get('/unread/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const unreadMessages = await db_1.db.select({
            id: schema_1.messages.id,
            senderId: schema_1.messages.senderId,
            recipientId: schema_1.messages.recipientId,
            message: schema_1.messages.message,
            createdAt: schema_1.messages.createdAt,
        })
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.recipientId, userId), (0, drizzle_orm_1.eq)(schema_1.messages.is_read, false)));
        res.json(unreadMessages);
    }
    catch (error) {
        console.error('❌ Error fetching unread messages:', error);
        res.status(500).json({ error: 'Failed to fetch unread messages' });
    }
});
// ===== GET MESSAGES BETWEEN TWO USERS (MAS MAUNA) =====
router.get('/:userId1/:userId2', async (req, res) => {
    try {
        const userId1 = parseInt(req.params.userId1, 10);
        const userId2 = parseInt(req.params.userId2, 10);
        if (isNaN(userId1) || isNaN(userId2)) {
            return res.status(400).json({ error: 'Invalid user IDs' });
        }
        const conversation = await db_1.db.select({
            id: schema_1.messages.id,
            senderId: schema_1.messages.senderId,
            recipientId: schema_1.messages.recipientId,
            message: schema_1.messages.message,
            createdAt: schema_1.messages.createdAt,
        })
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.senderId, userId1), (0, drizzle_orm_1.eq)(schema_1.messages.recipientId, userId2)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.senderId, userId2), (0, drizzle_orm_1.eq)(schema_1.messages.recipientId, userId1)))))
            .orderBy(schema_1.messages.createdAt);
        res.json(conversation);
    }
    catch (error) {
        console.error('❌ Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// ===== SAVE MESSAGE =====
router.post('/', async (req, res) => {
    try {
        const { senderId, recipientId, message } = req.body;
        if (!senderId || !recipientId || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const savedMessage = await db_1.db.insert(schema_1.messages)
            .values({
            senderId,
            recipientId,
            message,
            is_read: false,
        })
            .returning({
            id: schema_1.messages.id,
            senderId: schema_1.messages.senderId,
            recipientId: schema_1.messages.recipientId,
            message: schema_1.messages.message,
            createdAt: schema_1.messages.createdAt,
        });
        res.json(savedMessage[0]);
    }
    catch (error) {
        console.error('❌ Error saving message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});
// ===== MARK MESSAGE AS READ =====
router.put('/read/:messageId', async (req, res) => {
    try {
        const messageId = parseInt(req.params.messageId, 10);
        if (isNaN(messageId)) {
            return res.status(400).json({ error: 'Invalid message ID' });
        }
        await db_1.db.update(schema_1.messages)
            .set({
            is_read: true,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, messageId));
        res.json({ success: true });
    }
    catch (error) {
        console.error('❌ Error marking message as read:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});
// ===== CLEAR MESSAGES (DELETE CHAT) =====
router.delete('/clear/:userId1/:userId2', async (req, res) => {
    try {
        const userId1 = parseInt(req.params.userId1, 10);
        const userId2 = parseInt(req.params.userId2, 10);
        if (isNaN(userId1) || isNaN(userId2)) {
            return res.status(400).json({ error: 'Invalid user IDs' });
        }
        await db_1.db.delete(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.messages.senderId, userId1), (0, drizzle_orm_1.eq)(schema_1.messages.senderId, userId2)), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.messages.recipientId, userId1), (0, drizzle_orm_1.eq)(schema_1.messages.recipientId, userId2))));
        res.json({ success: true });
    }
    catch (error) {
        console.error('❌ Error clearing messages:', error);
        res.status(500).json({ error: 'Failed to clear messages' });
    }
});
exports.default = router;
