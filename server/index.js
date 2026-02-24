// ==========================================
// DAILY-UP SERVER - FINAL WORKING
// Developed by: UNSEEN-TERMINATION
// ==========================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ========== ROUTES ==========
const authRoutes = require('./routes/auth');
const habitsRoutes = require('./routes/habits'); // ADD THIS LINE

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes); // ADD THIS LINE

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'Server is running',
        time: new Date().toISOString()
    });
});

// ========== HTML ROUTES ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/intro.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/intro', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/intro.html'));
});

// ========== DATABASE ==========
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔌 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB Connected');
})
.catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
});

// ========== START ==========
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║    🚀 DAILY-UP SERVER STARTED        ║
║    👨‍💻 UNSEEN-TERMINATION            ║
╚══════════════════════════════════════╝
    `);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/test`);
    console.log(`🔑 Login: http://localhost:${PORT}/login`);
    console.log(`📝 Register: http://localhost:${PORT}/register`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});