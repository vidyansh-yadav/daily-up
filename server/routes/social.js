const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');

// ========== SEARCH USERS ==========
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json([]);
        }
        
        const users = await User.find({
            $and: [
                { _id: { $ne: req.userId } },
                {
                    $or: [
                        { username: { $regex: q, $options: 'i' } },
                        { email: { $regex: q, $options: 'i' } }
                    ]
                }
            ]
        }).select('username streak.current gamification.level');
        
        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== GET CHALLENGES ==========
router.get('/challenges', auth, async (req, res) => {
    try {
        const { type = 'active' } = req.query;
        
        let query = {};
        const now = new Date();
        
        if (type === 'active') {
            query = {
                'duration.startDate': { $lte: now },
                'duration.endDate': { $gte: now }
            };
        } else if (type === 'upcoming') {
            query = {
                'duration.startDate': { $gt: now }
            };
        } else if (type === 'my') {
            query = {
                'participants.user': req.userId
            };
        } else if (type === 'created') {
            query = {
                creator: req.userId
            };
        }
        
        const challenges = await Challenge.find(query)
            .populate('creator', 'username')
            .populate('participants.user', 'username')
            .sort({ createdAt: -1 });
        
        res.json(challenges || []);
    } catch (error) {
        console.error('Get challenges error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== CREATE CHALLENGE ==========
router.post('/challenges', auth, async (req, res) => {
    try {
        const challengeData = {
            ...req.body,
            creator: req.userId,
            participants: [{
                user: req.userId,
                joinedAt: new Date()
            }]
        };
        
        const challenge = new Challenge(challengeData);
        await challenge.save();
        
        res.status(201).json({
            message: 'Challenge created successfully',
            challenge
        });
    } catch (error) {
        console.error('Create challenge error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== JOIN CHALLENGE ==========
router.post('/challenges/:challengeId/join', auth, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.challengeId);
        
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        
        // Check if already joined
        if (challenge.participants && challenge.participants.some(p => p.user.toString() === req.userId.toString())) {
            return res.status(400).json({ error: 'Already joined this challenge' });
        }
        
        if (!challenge.participants) challenge.participants = [];
        
        challenge.participants.push({
            user: req.userId,
            joinedAt: new Date()
        });
        
        await challenge.save();
        
        res.json({ message: 'Joined challenge successfully', challenge });
    } catch (error) {
        console.error('Join challenge error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;