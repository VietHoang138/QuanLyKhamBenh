const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configure CORS to allow access from React frontend
app.use(cors({
    origin: '*', // For dev purposes, allow all origins. Can be restricted to specific origins later.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Clinic Management System API is running' });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// 404 Route handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'API Endpoint Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});

module.exports = app;
