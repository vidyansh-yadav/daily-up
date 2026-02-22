// ==========================================
// AUTH.JS - WITHOUT DATABASE VERSION
// Developed by: UNSEEN-TERMINATION
// ==========================================

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory storage (temporary)
const users = [];

// ========== TEST ROUTE ==========
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Auth routes working!',
        developer: 'UNSEEN-TERMINATION',
        timestamp: new Date().toISOString()
    });
});

// ========== REGISTER ROUTE ==========
router.post('/register', (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Check if user exists in memory
        const existingUser = users.find(u => u.email === email || u.username === username);
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists with this email or username' 
            });
        }

        // Create new user (simple password - no hash for demo)
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password, // In production, hash this!
            profile: {
                name: username,
                bio: '',
                skills: [],
                dailyGoal: 5
            },
            streak: {
                current: 1,
                longest: 1,
                lastActive: new Date()
            },
            createdAt: new Date()
        };

        users.push(newUser);

        // Create token
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        console.log('✅ User registered successfully:', username);

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                streak: newUser.streak,
                profile: newUser.profile
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Server error during registration' 
        });
    }
});

// ========== LOGIN ROUTE ==========
router.post('/login', (req, res) => {
    try {
        console.log('Login attempt:', req.body);

        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user in memory
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Simple password check (no bcrypt for demo)
        if (user.password !== password) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Update streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (user.streak.lastActive) {
            const lastActive = new Date(user.streak.lastActive);
            lastActive.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                user.streak.current += 1;
            } else if (diffDays > 1) {
                user.streak.current = 1;
            }
        }

        if (user.streak.current > user.streak.longest) {
            user.streak.longest = user.streak.current;
        }

        user.streak.lastActive = new Date();

        // Create token
        const token = jwt.sign(
            { userId: user.id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        console.log('✅ User logged in successfully:', user.username);

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                streak: user.streak,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Server error during login' 
        });
    }
});

// ========== VERIFY TOKEN ROUTE ==========
router.get('/verify', (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                streak: user.streak,
                profile: user.profile
            }
        });

    } catch (error) {
        res.status(401).json({ 
            error: 'Invalid token',
            valid: false 
        });
    }
});

// Create a test user
const testUser = {
    id: 'test123',
    username: 'TestDeveloper',
    email: 'test@daily-up.com',
    password: 'password123',
    profile: {
        name: 'Test Developer',
        bio: 'Just testing this awesome app!',
        skills: ['JavaScript', 'React', 'Node.js'],
        dailyGoal: 5
    },
    streak: {
        current: 7,
        longest: 15,
        lastActive: new Date()
    },
    createdAt: new Date()
};
users.push(testUser);
console.log('✅ Test user created: test@daily-up.com / password123');

module.exports = router;