"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
// ===== GET ALL USERS =====
router.get('/', async (req, res) => {
    try {
        const allUsers = await db_1.db.select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
            phone: schema_1.users.phone,
            createdAt: schema_1.users.createdAt,
        }).from(schema_1.users);
        res.json(allUsers);
    }
    catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// ===== GET USER BY ID =====
router.get('/:id', async (req, res) => {
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
        const user = await db_1.db.select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
            phone: schema_1.users.phone,
            createdAt: schema_1.users.createdAt,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user[0]);
    }
    catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// ===== UPDATE USER (PUT) =====
router.put('/:id', async (req, res) => {
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
        const updatedUser = await db_1.db.update(schema_1.users)
            .set({
            ...(name ? { name } : {}),
            ...(phone ? { phone } : {}),
            ...(avatar ? { avatar } : {}),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .returning({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
            phone: schema_1.users.phone,
            createdAt: schema_1.users.createdAt,
        });
        if (updatedUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updatedUser[0]);
    }
    catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
exports.default = router;
