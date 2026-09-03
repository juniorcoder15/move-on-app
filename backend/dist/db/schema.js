"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ===== USERS =====
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 255 }),
    avatar: (0, pg_core_1.varchar)('avatar', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
// ===== MESSAGES =====
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    senderId: (0, pg_core_1.integer)('sender_id').notNull(),
    recipientId: (0, pg_core_1.integer)('recipient_id').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    is_read: (0, pg_core_1.boolean)('is_read').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
