import { pgTable, serial, integer, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

// ===== USERS =====
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  avatar: varchar('avatar', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== MESSAGES =====
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull(),
  recipientId: integer('recipient_id').notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});