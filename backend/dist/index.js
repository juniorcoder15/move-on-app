"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const db_1 = require("./db");
const schema_1 = require("./db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const messages_1 = __importDefault(require("./routes/messages"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// ===== MIDDLEWARE =====
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ===== HTTP SERVER =====
const server = http_1.default.createServer(app);
// ===== SOCKET.IO =====
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
// ===== SOCKET CONNECTION =====
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    socket.on('join_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`📦 User ${userId} joined room user_${userId}`);
    });
    socket.on('send_message', (data) => {
        console.log(`📨 Message from ${data.senderId} to ${data.recipientId}: ${data.message}`);
        // ===== ITO ANG TUNAY NA FIX: I-emit LANG sa recipient =====
        io.to(`user_${data.recipientId}`).emit('receive_message', {
            id: data.id || Date.now(),
            senderId: data.senderId,
            recipientId: data.recipientId,
            senderName: data.senderName,
            message: data.message,
            createdAt: data.createdAt || new Date().toISOString(),
        });
        // ===== ITO AY TANGGALIN: socket.emit('message_sent', ...) =====
    });
    socket.on('typing', (data) => {
        io.to(`user_${data.recipientId}`).emit('user_typing', {
            senderId: data.senderId,
            senderName: data.senderName,
            isTyping: data.isTyping,
        });
    });
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});
// ===== ROUTES =====
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/messages', messages_1.default);
// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
    try {
        const result = await db_1.db.execute('SELECT NOW()');
        res.json({
            status: 'OK',
            time: result.rows[0].now,
            message: '🚀 Backend is running with Drizzle!'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Database connection failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/', (req, res) => {
    res.json({
        message: '🚀 ChatMeNow API is running!',
        endpoints: {
            health: 'GET /api/health',
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            users: 'GET /api/users',
            messages: 'GET /api/messages/:userId1/:userId2',
        },
    });
});
// ===== DELETE MESSAGES (CLEAR CHAT) =====
app.delete('/api/messages/clear/:userId1/:userId2', async (req, res) => {
    const { userId1, userId2 } = req.params;
    try {
        await db_1.db.delete(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.messages.senderId, parseInt(userId1)), (0, drizzle_orm_1.eq)(schema_1.messages.senderId, parseInt(userId2))), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.messages.recipientId, parseInt(userId1)), (0, drizzle_orm_1.eq)(schema_1.messages.recipientId, parseInt(userId2)))));
        res.json({ success: true });
    }
    catch (error) {
        console.error('❌ Error clearing messages:', error);
        res.status(500).json({ error: 'Failed to clear messages' });
    }
});
// ===== START SERVER =====
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
});
