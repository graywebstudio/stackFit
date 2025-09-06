// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const errorHandler = require("./middleware/errorHandler");
const { authenticateToken } = require('./middleware/authMiddleware');
const memberRoutes = require('./routes/members');
const membershipRoutes = require('./routes/membership');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

const app = express();

// Configure CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rate limiting with proper JSON response - increased for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased from 100 to 1000 requests per windowMs for development
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please try again later'
        });
    }
});
app.use(limiter);

// Public route for login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password123') { 
        const token = jwt.sign({ 
            username,
            role: 'admin'
        }, process.env.JWT_SECRET || 'supersecretkey', { 
            expiresIn: '1h' 
        }); 
        return res.json({ token }); 
    } 
    res.status(401).json({ error: 'Invalid credentials' });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/members', authenticateToken, memberRoutes);
app.use('/api/memberships', authenticateToken, membershipRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
