const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// ========== GET USER GAMIFICATION DATA ==========
router.get('/profile', auth, async (req, res) => {
    try {
        console.log('📊 Loading gamification for user:', req.userId);
        
        const user = await User.findById(req.userId)
            .select('gamification streak stats preferences');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Ensure gamification object exists
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
        
        // Ensure achievements array exists
        if (!user.gamification.achievements) {
            user.gamification.achievements = [];
        }
        
        // Ensure badges array exists
        if (!user.gamification.badges) {
            user.gamification.badges = [];
        }
        
        // Format achievements for frontend
        const achievements = user.gamification.achievements.map(ach => ({
            achievement: {
                name: ach.title || 'Achievement',
                icon: ach.icon || 'fas fa-medal',
                description: ach.description || ''
            },
            completed: true,
            completedAt: ach.completedAt
        }));
        
        res.json({
            gamification: {
                level: user.gamification.level || 1,
                xp: user.gamification.xp || 0,
                xpToNextLevel: user.gamification.xpToNextLevel || 100,
                totalXpEarned: user.gamification.totalXpEarned || 0,
                badges: user.gamification.badges || []
            },
            achievements: achievements,
            streak: user.streak || { current: 0, longest: 0 },
            stats: user.stats || { totalCompletions: 0, totalTimeSpent: 0 }
        });
        
    } catch (error) {
        console.error('❌ Gamification error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== GET LEADERBOARD ==========
router.get('/leaderboard', auth, async (req, res) => {
    try {
        const { timeframe = 'all', limit = 50 } = req.query;
        
        let match = {};
        const now = new Date();
        
        if (timeframe === 'weekly') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            match = { createdAt: { $gte: weekAgo } };
        } else if (timeframe === 'monthly') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            match = { createdAt: { $gte: monthAgo } };
        }
        
        const leaderboard = await User.aggregate([
            { $match: match },
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

// ========== ADD XP (CALLED WHEN HABIT COMPLETED) ==========
router.post('/add-xp', auth, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Initialize gamification if not exists
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
        
        // Add XP
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
                description: `Reached level ${newLevel}`,
                earnedAt: new Date()
            });
        }
        
        // Check for achievements
        await checkAchievements(user);
        
        await user.save();
        
        // Emit real-time update if socket.io is available
        if (req.io) {
            req.io.to(`user:${req.userId}`).emit('xp-updated', {
                xp: user.gamification.xp,
                level: user.gamification.level,
                leveledUp,
                newLevel,
                reason
            });
        }
        
        res.json({
            message: 'XP added successfully',
            gamification: {
                level: user.gamification.level,
                xp: user.gamification.xp,
                xpToNextLevel: user.gamification.xpToNextLevel,
                totalXpEarned: user.gamification.totalXpEarned
            },
            leveledUp,
            newLevel
        });
        
    } catch (error) {
        console.error('Add XP error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== CHECK AND UPDATE ACHIEVEMENTS ==========
async function checkAchievements(user) {
    try {
        if (!user.gamification) return;
        if (!user.gamification.achievements) user.gamification.achievements = [];
        
        const newAchievements = [];
        const Habit = require('../models/Habit');
        const habitCount = await Habit.countDocuments({ userId: user._id });
        
        // Streak achievements
        if (user.streak.current >= 7 && !hasAchievement(user, '7 Day Streak')) {
            newAchievements.push({
                title: '7 Day Streak',
                description: 'Maintained a streak for 7 days',
                icon: 'fas fa-fire',
                xpReward: 100,
                completedAt: new Date()
            });
        }
        
        if (user.streak.current >= 30 && !hasAchievement(user, '30 Day Streak')) {
            newAchievements.push({
                title: '30 Day Streak',
                description: 'Maintained a streak for 30 days',
                icon: 'fas fa-crown',
                xpReward: 500,
                completedAt: new Date()
            });
        }
        
        // Habit count achievements
        if (habitCount >= 5 && !hasAchievement(user, 'Habit Starter')) {
            newAchievements.push({
                title: 'Habit Starter',
                description: 'Created 5 habits',
                icon: 'fas fa-seedling',
                xpReward: 50,
                completedAt: new Date()
            });
        }
        
        if (habitCount >= 10 && !hasAchievement(user, 'Habit Master')) {
            newAchievements.push({
                title: 'Habit Master',
                description: 'Created 10 habits',
                icon: 'fas fa-tasks',
                xpReward: 200,
                completedAt: new Date()
            });
        }
        
        // Total completions achievements
        if (user.stats?.totalCompletions >= 50 && !hasAchievement(user, 'Bronze Member')) {
            newAchievements.push({
                title: 'Bronze Member',
                description: 'Completed 50 habits',
                icon: 'fas fa-medal',
                xpReward: 150,
                completedAt: new Date()
            });
        }
        
        if (user.stats?.totalCompletions >= 100 && !hasAchievement(user, 'Century Club')) {
            newAchievements.push({
                title: 'Century Club',
                description: 'Completed 100 habits',
                icon: 'fas fa-star',
                xpReward: 1000,
                completedAt: new Date()
            });
        }
        
        // Add new achievements
        for (const ach of newAchievements) {
            user.gamification.achievements.push(ach);
            
            // Add XP for achievement
            user.gamification.xp += ach.xpReward;
            user.gamification.totalXpEarned += ach.xpReward;
            
            // Add badge
            if (!user.gamification.badges) user.gamification.badges = [];
            user.gamification.badges.push({
                name: ach.title,
                icon: ach.icon,
                description: ach.description,
                earnedAt: new Date()
            });
        }
        
    } catch (error) {
        console.error('Check achievements error:', error);
    }
}

function hasAchievement(user, title) {
    if (!user.gamification?.achievements) return false;
    return user.gamification.achievements.some(a => a.title === title);
}

module.exports = router;