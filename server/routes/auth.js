// ==========================================
// AUTH.JS - WITH DATABASE CONNECTION
// Developed by: UNSEEN-TERMINATION
// ==========================================

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ========== TEST ROUTE ==========
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Auth routes working with database!',
        developer: 'UNSEEN-TERMINATION',
        timestamp: new Date().toISOString()
    });
});

// ========== REGISTER ROUTE ==========
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Registration attempt:', req.body);
        
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

        // Check if user exists in database
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists with this email or username' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user in database
        const user = new User({
            username,
            email,
            password: hashedPassword,
            profile: {
                name: username,
                bio: 'New to Daily-Up!',
                skills: [],
                dailyGoal: 5
            },
            streak: {
                current: 1,
                longest: 1,
                lastActive: new Date()
            }
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        console.log('✅ User registered successfully in database:', username);

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                streak: user.streak,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            error: 'Server error during registration. Please try again.' 
        });
    }
});

// ========== LOGIN ROUTE ==========
router.post('/login', async (req, res) => {
    try {
        console.log('🔑 Login attempt:', req.body.email);

        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user in database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
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
                // Consecutive day
                user.streak.current += 1;
            } else if (diffDays > 1) {
                // Streak broken
                user.streak.current = 1;
            }
        } else {
            user.streak.current = 1;
        }

        // Update longest streak
        if (user.streak.current > user.streak.longest) {
            user.streak.longest = user.streak.current;
        }

        user.streak.lastActive = new Date();
        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        console.log('✅ User logged in successfully:', user.username);

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                streak: user.streak,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            error: 'Server error during login. Please try again.' 
        });
    }
});

// ========== VERIFY TOKEN ROUTE ==========
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            valid: true,
            user: {
                id: user._id,
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

module.exports = router;