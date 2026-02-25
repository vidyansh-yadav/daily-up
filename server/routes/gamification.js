const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');  // Yeh path sahi hai

// ========== GET USER GAMIFICATION DATA ==========
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('gamification streak stats preferences');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            gamification: user.gamification || {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                totalXpEarned: 0,
                badges: [],
                achievements: []
            },
            streak: user.streak || { current: 0, longest: 0 },
            stats: user.stats || { totalCompletions: 0, totalTimeSpent: 0 }
        });
    } catch (error) {
        console.error('Gamification error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== GET LEADERBOARD ==========
router.get('/leaderboard', auth, async (req, res) => {
    try {
        const { timeframe = 'all', limit = 50 } = req.query;
        
        const leaderboard = await User.aggregate([
            { $project: {
                username: 1,
                'gamification.level': 1,
                'gamification.totalXpEarned': 1,
                'streak.current': 1,
                'stats.totalCompletions': 1
            }},
            { $sort: { 'gamification.totalXpEarned': -1 } },
            { $limit: parseInt(limit) }
        ]);
        
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== ADD XP ==========
router.post('/add-xp', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (!user.gamification) {
            user.gamification = {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                totalXpEarned: 0,
                badges: [],
                achievements: []
            };
        }
        
        user.gamification.xp += amount;
        user.gamification.totalXpEarned += amount;
        
        let leveledUp = false;
        let newLevel = user.gamification.level;
        
        // Level up logic
        while (user.gamification.xp >= user.gamification.xpToNextLevel) {
            user.gamification.level += 1;
            user.gamification.xp -= user.gamification.xpToNextLevel;
            user.gamification.xpToNextLevel = Math.floor(user.gamification.xpToNextLevel * 1.5);
            leveledUp = true;
            newLevel = user.gamification.level;
            
            // Add level up badge
            if (!user.gamification.badges) user.gamification.badges = [];
            user.gamification.badges.push({
                name: `Level ${newLevel} Achieved`,
                icon: 'fas fa-level-up-alt',
                earnedAt: new Date()
            });
        }
        
        await user.save();
        
        // Emit real-time update if socket.io is available
        if (req.io) {
            req.io.to(`user:${req.userId}`).emit('xp-updated', {
                xp: user.gamification.xp,
                level: user.gamification.level,
                leveledUp,
                newLevel
            });
        }
        
        res.json({
            message: 'XP added successfully',
            gamification: user.gamification,
            leveledUp,
            newLevel
        });
    } catch (error) {
        console.error('Add XP error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;