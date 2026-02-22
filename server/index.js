import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import ownerRoutes from './routes/owners.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties', ownerRoutes);

// Resolve short Google Maps URLs to extract coordinates
app.get('/api/resolve-url', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const response = await fetch(url, { redirect: 'follow' });
        const finalUrl = response.url;
        res.json({ url: finalUrl });
    } catch (err) {
        res.status(400).json({ error: 'Could not resolve URL', details: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Property Analyst API running on http://localhost:${PORT}`);
});
