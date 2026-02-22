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

// Get all habits for user
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

// Create new habit
router.post('/', verifyToken, async (req, res) => {
    try {
        const habitData = {
            ...req.body,
            userId: req.userId
        };
        
        const habit = new Habit(habitData);
        await habit.save();
        
        res.status(201).json({
            message: 'Habit created successfully',
            habit
        });
    } catch (error) {
        console.error('Create habit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update habit
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

// Mark habit as completed
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
                timeSpent: timeSpent || 0,
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
            
            // Calculate success rate (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentCompletions = habit.completedDates.filter(completion => 
                new Date(completion.date) >= thirtyDaysAgo
            );
            
            const daysSinceStart = Math.min(30, Math.ceil((today - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24)));
            habit.statistics.successRate = daysSinceStart > 0 ? 
                Math.round((recentCompletions.length / daysSinceStart) * 100) : 0;
            
            await habit.save();
        }
        
        res.json({
            message: alreadyCompleted ? 'Already completed today' : 'Habit marked as completed',
            habit
        });
    } catch (error) {
        console.error('Complete habit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete habit
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

// Get statistics
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
            categoryDistribution: {}
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        habits.forEach(habit => {
            stats.totalCompletions += habit.statistics.totalCompletions;
            stats.averageSuccessRate += habit.statistics.successRate;
            
            // Check if completed today
            const completedToday = habit.completedDates.some(completion => {
                const compDate = new Date(completion.date);
                compDate.setHours(0, 0, 0, 0);
                return compDate.getTime() === today.getTime();
            });
            
            if (completedToday) {
                stats.completedToday += 1;
            }
            
            // Add to category distribution
            stats.categoryDistribution[habit.category] = 
                (stats.categoryDistribution[habit.category] || 0) + 1;
            
            // Add streak
            stats.streaks.push({
                title: habit.title,
                streak: habit.statistics.streak,
                longestStreak: habit.statistics.longestStreak
            });
        });
        
        if (habits.length > 0) {
            stats.averageSuccessRate = Math.round(stats.averageSuccessRate / habits.length);
        }
        
        // Calculate weekly progress (last 7 days)
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

module.exports = router;