// ==========================================
// DAILY-UP SERVER - MAIN FILE
// Developed by: UNSEEN-TERMINATION
// ==========================================

require('dotenv').config();
const express = require('express');
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

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'Server is running!',
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
// Profile page route
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

// Analytics page route
app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/analytics.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
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
    console.log('\n📧 Test Credentials:');
    console.log('   Email: test@daily-up.com');
    console.log('   Password: password123');
    console.log('⚠️  Running WITHOUT MongoDB - Data not persistent');
    console.log('==========================================');
});