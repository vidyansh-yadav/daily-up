const express = require('express');
const Habit = require('../models/Habit');
const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    try {
        const jwt = require('jsonwebtoken');
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        req.userId = verified.userId;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// ========== GET ALL HABITS ==========
router.get('/', verifyToken, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId })
            .sort({ createdAt: -1 });
        res.json(habits);
    } catch (error) {
        console.error('Get habits error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== CREATE NEW HABIT ==========
router.post('/', verifyToken, async (req, res) => {
    try {
        console.log('Creating habit for user:', req.userId);
        
        const habitData = {
            ...req.body,
            userId: req.userId
        };
        
        const habit = new Habit(habitData);
        await habit.save();
        
        console.log('✅ Habit created:', habit.title);
        
        res.status(201).json({
            message: 'Habit created successfully',
            habit
        });
    } catch (error) {
        console.error('Create habit error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== UPDATE HABIT ==========
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const habit = await Habit.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true }
        );
        
        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }
        
        res.json({
            message: 'Habit updated successfully',
            habit
        });
    } catch (error) {
        console.error('Update habit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== MARK HABIT AS COMPLETED (WITH XP) ==========
router.post('/:id/complete', verifyToken, async (req, res) => {
    try {
        const { date, timeSpent, notes } = req.body;
        const completionDate = date ? new Date(date) : new Date();
        
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        
        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }
        
        // Check if already completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const alreadyCompleted = habit.completedDates.some(completion => {
            const compDate = new Date(completion.date);
            compDate.setHours(0, 0, 0, 0);
            return compDate.getTime() === today.getTime();
        });
        
        if (!alreadyCompleted) {
            habit.completedDates.push({
                date: completionDate,
                timeSpent: timeSpent || 30,
                notes: notes || ''
            });
            
            habit.statistics.totalCompletions += 1;
            
            // Update streak
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const completedYesterday = habit.completedDates.some(completion => {
                const compDate = new Date(completion.date);
                compDate.setHours(0, 0, 0, 0);
                return compDate.getTime() === yesterday.getTime();
            });
            
            if (completedYesterday) {
                habit.statistics.streak += 1;
            } else {
                habit.statistics.streak = 1;
            }
            
            if (habit.statistics.streak > habit.statistics.longestStreak) {
                habit.statistics.longestStreak = habit.statistics.streak;
            }
            
            // Calculate success rate
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentCompletions = habit.completedDates.filter(completion => 
                new Date(completion.date) >= thirtyDaysAgo
            );
            
            const daysSinceStart = Math.min(30, Math.ceil((today - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24)));
            habit.statistics.successRate = daysSinceStart > 0 ? 
                Math.round((recentCompletions.length / daysSinceStart) * 100) : 0;
            
            await habit.save();
            
            // ========== ADD XP FOR COMPLETING HABIT ==========
            const XP_AMOUNT = 50;
            
            try {
                // Use internal function call instead of HTTP request
                const User = require('../models/User');
                const user = await User.findById(req.userId);
                
                if (!user) {
                    throw new Error('User not found');
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
                user.gamification.xp += XP_AMOUNT;
                user.gamification.totalXpEarned += XP_AMOUNT;
                
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
                
                console.log(`✅ XP added: ${XP_AMOUNT}, Level up: ${leveledUp}`);
                
                return res.json({
                    message: 'Habit marked as completed',
                    habit,
                    stats: {
                        streak: habit.statistics.streak,
                        totalCompletions: habit.statistics.totalCompletions,
                        successRate: habit.statistics.successRate
                    },
                    xpAdded: XP_AMOUNT,
                    levelUp: leveledUp,
                    newLevel: leveledUp ? newLevel : null
                });
                
            } catch (xpError) {
                console.error('Failed to add XP:', xpError.message);
                return res.json({
                    message: 'Habit marked as completed (XP not added)',
                    habit,
                    stats: {
                        streak: habit.statistics.streak,
                        totalCompletions: habit.statistics.totalCompletions,
                        successRate: habit.statistics.successRate
                    },
                    xpAdded: 0,
                    levelUp: false
                });
            }
            
        } else {
            res.json({ 
                message: 'Already completed today',
                habit 
            });
        }
    } catch (error) {
        console.error('Complete habit error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== DELETE HABIT ==========
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const habit = await Habit.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }
        
        res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
        console.error('Delete habit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== GET STATISTICS ==========
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId });
        
        const stats = {
            totalHabits: habits.length,
            completedToday: 0,
            totalCompletions: 0,
            averageSuccessRate: 0,
            streaks: [],
            weeklyProgress: {},
            categoryDistribution: {},
            schoolSubjects: [],
            totalStudyTime: 0
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        habits.forEach(habit => {
            stats.totalCompletions += habit.statistics.totalCompletions;
            stats.averageSuccessRate += habit.statistics.successRate;
            
            habit.completedDates.forEach(c => {
                stats.totalStudyTime += c.timeSpent || 30;
            });
            
            const completedToday = habit.completedDates.some(completion => {
                const compDate = new Date(completion.date);
                compDate.setHours(0, 0, 0, 0);
                return compDate.getTime() === today.getTime();
            });
            
            if (completedToday) {
                stats.completedToday += 1;
            }
            
            stats.categoryDistribution[habit.category] = 
                (stats.categoryDistribution[habit.category] || 0) + 1;
            
            if (habit.isSchoolSubject) {
                stats.schoolSubjects.push({
                    title: habit.title,
                    subjectCode: habit.subjectCode,
                    completed: habit.completedDates.length,
                    streak: habit.statistics.streak
                });
            }
            
            stats.streaks.push({
                title: habit.title,
                streak: habit.statistics.streak,
                longestStreak: habit.statistics.longestStreak
            });
        });
        
        if (habits.length > 0) {
            stats.averageSuccessRate = Math.round(stats.averageSuccessRate / habits.length);
        }
        
        // Weekly progress
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            let dayCompletions = 0;
            habits.forEach(habit => {
                const completed = habit.completedDates.some(completion => {
                    const compDate = new Date(completion.date);
                    compDate.setHours(0, 0, 0, 0);
                    return compDate.getTime() === date.getTime();
                });
                if (completed) dayCompletions += 1;
            });
            
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            stats.weeklyProgress[dayName] = dayCompletions;
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== GET TODAY'S TIMETABLE ==========
router.get('/timetable/today', verifyToken, async (req, res) => {
    try {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const habits = await Habit.find({ 
            userId: req.userId,
            [`schedule.${dayName}`]: true
        }).sort({ 'timeSlot.startTime': 1 });
        
        res.json(habits);
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== UPDATE TIMETABLE ==========
router.post('/timetable/update', verifyToken, async (req, res) => {
    try {
        const { day, slots } = req.body;
        
        for (const slot of slots) {
            await Habit.findOneAndUpdate(
                { 
                    _id: slot.habitId, 
                    userId: req.userId 
                },
                { 
                    'timeSlot.startTime': slot.startTime,
                    'timeSlot.endTime': slot.endTime
                }
            );
        }
        
        res.json({ message: 'Timetable updated successfully' });
    } catch (error) {
        console.error('Update timetable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== ACHIEVEMENT CHECK FUNCTION ==========
async function checkAchievements(user) {
    try {
        if (!user.gamification) return;
        if (!user.gamification.achievements) user.gamification.achievements = [];
        
        const Habit = require('../models/Habit');
        const habitCount = await Habit.countDocuments({ userId: user._id });
        
        const newAchievements = [];
        
        function hasAchievement(title) {
            return user.gamification.achievements.some(a => a.title === title);
        }
        
        // Streak achievements
        if (user.streak.current >= 7 && !hasAchievement('7 Day Streak')) {
            newAchievements.push({
                title: '7 Day Streak',
                description: 'Maintained a streak for 7 days',
                icon: 'fas fa-fire',
                xpReward: 100,
                completedAt: new Date()
            });
        }
        
        if (user.streak.current >= 30 && !hasAchievement('30 Day Streak')) {
            newAchievements.push({
                title: '30 Day Streak',
                description: 'Maintained a streak for 30 days',
                icon: 'fas fa-crown',
                xpReward: 500,
                completedAt: new Date()
            });
        }
        
        // Habit count achievements
        if (habitCount >= 5 && !hasAchievement('Habit Starter')) {
            newAchievements.push({
                title: 'Habit Starter',
                description: 'Created 5 habits',
                icon: 'fas fa-seedling',
                xpReward: 50,
                completedAt: new Date()
            });
        }
        
        if (habitCount >= 10 && !hasAchievement('Habit Master')) {
            newAchievements.push({
                title: 'Habit Master',
                description: 'Created 10 habits',
                icon: 'fas fa-tasks',
                xpReward: 200,
                completedAt: new Date()
            });
        }
        
        // Completion achievements
        if (user.stats?.totalCompletions >= 50 && !hasAchievement('Bronze Member')) {
            newAchievements.push({
                title: 'Bronze Member',
                description: 'Completed 50 habits',
                icon: 'fas fa-medal',
                xpReward: 150,
                completedAt: new Date()
            });
        }
        
        if (user.stats?.totalCompletions >= 100 && !hasAchievement('Century Club')) {
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

module.exports = router;