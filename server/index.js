// ==========================================
// DAILY-UP SERVER - WITH DATABASE
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
app.use('/api/auth', authRoutes);

// Habit routes (add these later)
// const habitRoutes = require('./routes/habits');
// app.use('/api/habits', habitRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'Server is running with database!',
        developer: 'UNSEEN-TERMINATION',
        timestamp: new Date().toISOString()
    });
});

// ========== HTML ROUTES ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
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

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/analytics.html'));
});

// ========== DATABASE CONNECTION ==========
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔌 Connecting to MongoDB Atlas...');
console.log('URI:', MONGODB_URI ? '✓ Found' : '✗ Not found');

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    process.exit(1);
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log('📊 Database: daily-up');
    console.log('💾 Data will be saved permanently');
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  Please check your connection string and network');
    process.exit(1);
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║               🚀 DAILY-UP SERVER                      ║
║               👨‍💻 UNSEEN-TERMINATION                  ║
╚══════════════════════════════════════════════════════╝
    `);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📊 Test API: http://localhost:${PORT}/api/test`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/test`);
    console.log(`🏠 Home: http://localhost:${PORT}`);
    console.log(`🔑 Login: http://localhost:${PORT}/login`);
    console.log(`📝 Register: http://localhost:${PORT}/register`);
    console.log(`📈 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`👤 Profile: http://localhost:${PORT}/profile`);
    console.log(`📊 Analytics: http://localhost:${PORT}/analytics`);
    console.log('\n💾 Database: MongoDB Atlas Connected');
    console.log('✅ Data will be saved permanently');
    console.log('==========================================');
});