// ==========================================
// DAILY-UP SERVER - ULTIMATE VERSION
// All Features Integrated
// ==========================================
process.env.NO_REDIS_WARNINGS = 'true';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { createServer } = require('http');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', credentials: true }
});

// ========== REDIS CACHE (SILENT MODE - NO WARNINGS) ==========
let redisClient = null;

// Completely disable Redis if not needed
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

if (REDIS_ENABLED) {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: false
            }
        });
        
        // Suppress specific errors
        redisClient.on('error', () => {
            // Silently fail - no console output
        });
        
        // Attempt connection silently
        redisClient.connect().catch(() => {
            redisClient = null;
        });
    } catch {
        redisClient = null;
    }
}



// Optional: Log once at startup
if (!REDIS_ENABLED) {
    console.log('📌 Redis cache disabled');
}

// Make redis available globally (may be null)
app.locals.redis = redisClient;

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet({
    contentSecurityPolicy: false,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// ========== REGULAR MIDDLEWARE ==========
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ========== SOCKET.IO FOR REAL-TIME (SINGLE INSTANCE) ==========
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    
    socket.on('join-user', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their room`);
    });
    
    socket.on('join-chat', (chatId) => {
        socket.join(`chat-${chatId}`);
        console.log(`Socket joined chat room: ${chatId}`);
    });
    
    socket.on('leave-chat', (chatId) => {
        socket.leave(`chat-${chatId}`);
    });
    
    socket.on('habit-completed', (data) => {
        socket.to(`user:${data.userId}`).emit('habit-updated', data);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use((req, res, next) => {
    req.io = io;
    req.redis = redisClient;
    next();
});

// ========== DATABASE CONNECTION ==========
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
});

// ========== ROUTES ==========
const authRoutes = require('./routes/auth');
const habitsRoutes = require('./routes/habits');
const gamificationRoutes = require('./routes/gamification');
const socialRoutes = require('./routes/social');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat'); 

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes); 

// ========== TEST ROUTE ==========
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

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/challenges', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/challenges.html'));
});

app.get('/pomodoro', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pomodoro.html'));
});

app.get('/journal', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/journal.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/analytics.html'));
});

app.get('/intro', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/intro.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/chat.html'));
});

// ========== SCHEDULED TASKS ==========
// Daily reminder at 8 AM
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Sending daily reminders...');
    try {
        const User = require('./models/User');
        const users = await User.find({ 'settings.notifications': true });
        
        users.forEach(user => {
            // Send reminder logic here
            console.log(`Reminder sent to ${user.email}`);
        });
    } catch (error) {
        console.error('Reminder error:', error);
    }
});

// Weekly report every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
    console.log('📊 Generating weekly reports...');
    // Generate and send weekly reports
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║    🚀 DAILY-UP ULTIMATE EDITION STARTED      ║
║    👨‍💻 UNSEEN-TERMINATION                    ║
╚══════════════════════════════════════════════╝
    `);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🔑 Login: http://localhost:${PORT}/login`);
    console.log(`📝 Register: http://localhost:${PORT}/register`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`💬 Chat: http://localhost:${PORT}/chat`);
});