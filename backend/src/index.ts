import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import messagesRoutes from './routes/messages';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);

// Socket.io
io.on('connection', (socket) => {
  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`📦 User ${userId} joined room user_${userId}`);
  });

  // ===== ITO ANG TAMANG FIX: I-emit lang sa receiver =====
  socket.on('send_message', (data) => {
    console.log(`📨 Message from ${data.senderId} to ${data.recipientId}: ${data.message}`);
    
    io.to(`user_${data.recipientId}`).emit('receive_message', {
      id: data.id || Date.now(),
      senderId: data.senderId,
      senderName: data.senderName,
      recipientId: data.recipientId, // ✅ IDAGDAG ITO
      message: data.message,
      createdAt: data.createdAt || new Date().toISOString(),
    });
  });
});

server.listen(5001, () => console.log('✅ Server running'));