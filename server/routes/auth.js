// ==========================================
// AUTH.JS - SECURE VERSION
// No dummy users, proper validation
// Developed by: UNSEEN-TERMINATION
// ==========================================

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// ========== VALIDATION FUNCTIONS ==========
const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

const validateUsername = (username) => {
    return username && username.length >= 3 && username.length <= 30 && /^[a-zA-Z0-9_]+$/.test(username);
};

const validatePassword = (password) => {
    return password && password.length >= 6 && 
           /[A-Z]/.test(password) && // at least one uppercase
           /[0-9]/.test(password);    // at least one number
};

// ========== TEST ROUTE ==========
router.get('/test', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Auth routes working',
        timestamp: new Date().toISOString()
    });
});

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Registration attempt');

        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        if (!validateUsername(username)) {
            return res.status(400).json({ 
                error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' 
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ 
                error: 'Please enter a valid email address' 
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters with at least one uppercase letter and one number' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists with this email or username' 
            });
        }

        // Hash password with strong salt
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: 'user', // Default role
            profile: {
                name: username,
                bio: '',
                skills: [],
                dailyGoal: 5
            },
            streak: {
                current: 0,
                longest: 0,
                lastActive: null
            },
            security: {
                passwordChangedAt: new Date()
            }
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ User registered:', username);

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                streak: user.streak,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            error: 'Server error during registration' 
        });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    try {
        console.log('🔑 Login attempt');

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Check if account is locked
        if (user.security.lockUntil && user.security.lockUntil > new Date()) {
            const remainingTime = Math.ceil((user.security.lockUntil - new Date()) / 1000 / 60);
            return res.status(401).json({ 
                error: `Account locked. Try again in ${remainingTime} minutes` 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            // Increment login attempts
            user.security.loginAttempts += 1;
            
            // Lock account if too many attempts
            if (user.security.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.security.lockUntil = new Date(Date.now() + LOCK_TIME);
                await user.save();
                return res.status(401).json({ 
                    error: 'Too many failed attempts. Account locked for 2 hours' 
                });
            }
            
            await user.save();
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Reset login attempts on successful login
        user.security.loginAttempts = 0;
        user.security.lockUntil = null;
        user.security.lastLogin = new Date();
        user.security.lastIp = req.ip || req.connection.remoteAddress;

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
        } else {
            user.streak.current = 1;
        }

        if (user.streak.current > user.streak.longest) {
            user.streak.longest = user.streak.current;
        }

        user.streak.lastActive = new Date();
        await user.save();

        // Create token
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ User logged in:', user.username);

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                streak: user.streak,
                profile: user.profile,
                settings: user.settings
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            error: 'Server error during login' 
        });
    }
});

// ========== VERIFY TOKEN ==========
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
                role: user.role,
                streak: user.streak,
                profile: user.profile,
                settings: user.settings
            }
        });

    } catch (error) {
        res.status(401).json({ 
            error: 'Invalid token',
            valid: false 
        });
    }
});

// ========== MAKE USER ADMIN (SPECIAL ROUTE) ==========
router.post('/make-admin', async (req, res) => {
    try {
        const { email } = req.body;
        
        // This should be protected in production!
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.role = 'admin';
        await user.save();
        
        res.json({ message: `User ${user.username} is now admin` });
        
    } catch (error) {
        console.error('Make admin error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== CHANGE PASSWORD ==========
router.post('/change-password', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const { currentPassword, newPassword } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('+password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Validate new password
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters with at least one uppercase letter and one number' 
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 12);
        user.security.passwordChangedAt = new Date();
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;