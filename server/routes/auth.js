import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        // Check if broker already exists
        const { data: existing } = await supabase
            .from('brokers')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert broker
        const { data: broker, error } = await supabase
            .from('brokers')
            .insert({ name, email, password_hash })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Registration failed.', details: error.message });
        }

        // Generate JWT
        const token = jwt.sign(
            { broker_id: broker.id, email: broker.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful.',
            token,
            broker: { id: broker.id, name: broker.name, email: broker.email }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.', details: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find broker
        const { data: broker, error } = await supabase
            .from('brokers')
            .select('*')
            .eq('email', email)
            .single();

        if (!broker) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, broker.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { broker_id: broker.id, email: broker.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful.',
            token,
            broker: { id: broker.id, name: broker.name, email: broker.email }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.', details: err.message });
    }
});

export default router;
