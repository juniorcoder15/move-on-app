import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { db } from './db';
import { messages } from './db/schema';
import { and, or, eq } from 'drizzle-orm';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import messagesRoutes from './routes/messages';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== HTTP SERVER =====
const server = http.createServer(app);

// ===== SOCKET.IO =====
const io = new SocketServer(server, {
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
    
    // ===== ITO YUNG BAGONG IDINAGDAG: I-echo lang sa recipient, HINDI sa sender =====
    io.to(`user_${data.recipientId}`).emit('receive_message', {
      id: data.id || Date.now(),
      senderId: data.senderId,
      senderName: data.senderName,
      message: data.message,
      createdAt: data.createdAt || new Date().toISOString(),
    });
    
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
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.execute('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      time: result.rows[0].now,
      message: '🚀 Backend is running with Drizzle!'
    });
  } catch (error) {
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
    await db.delete(messages)
      .where(
        and(
          or(
            eq(messages.senderId, parseInt(userId1)),
            eq(messages.senderId, parseInt(userId2))
          ),
          or(
            eq(messages.recipientId, parseInt(userId1)),
            eq(messages.recipientId, parseInt(userId2))
          )
        )
      );
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error clearing messages:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
});

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
});