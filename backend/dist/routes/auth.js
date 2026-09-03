"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
router.post('/register', async (req, res) => {
    console.log('📝 Register request received:', req.body);
    try {
        const { name, email, password, phone, avatar } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // ===== ITO YUNG TAMANG VALUES (may phone at avatar, at passwordHash) =====
        const newUser = await db_1.db.insert(schema_1.users).values({
            name,
            email,
            passwordHash: hashedPassword,
            phone: phone || '',
            avatar: avatar || '👤',
        }).returning();
        const token = jsonwebtoken_1.default.sign({ id: newUser[0].id, email: newUser[0].email }, JWT_SECRET, { expiresIn: '7d' });
        console.log('✅ User registered:', newUser[0].email);
        res.status(201).json({
            token,
            user: {
                id: newUser[0].id,
                name: newUser[0].name,
                email: newUser[0].email,
                phone: newUser[0].phone,
                avatar: newUser[0].avatar,
                createdAt: newUser[0].createdAt,
            },
        });
    }
    catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
router.post('/login', async (req, res) => {
    console.log('🔐 Login request received:', req.body.email);
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // ===== ITO YUNG TAMANG CHECK: Hanapin ang passwordHash, HINDI password =====
        const user = await db_1.db.select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            phone: schema_1.users.phone,
            avatar: schema_1.users.avatar,
            passwordHash: schema_1.users.passwordHash,
            createdAt: schema_1.users.createdAt,
        }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (user.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // ===== ITO YUNG TAMANG CHECK: Kung walang passwordHash, mag-error =====
        if (!user[0].passwordHash) {
            return res.status(400).json({ error: 'Password not set for this user' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user[0].passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user[0].id, email: user[0].email }, JWT_SECRET, { expiresIn: '7d' });
        console.log('✅ User logged in:', user[0].email);
        res.json({
            token,
            user: {
                id: user[0].id,
                name: user[0].name,
                email: user[0].email,
                phone: user[0].phone,
                avatar: user[0].avatar,
                createdAt: user[0].createdAt,
            },
        });
    }
    catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.default = router;
