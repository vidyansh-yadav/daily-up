const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Habit = require('../models/Habit');
const Journal = require('../models/Journal');
const Pomodoro = require('../models/Pomodoro');
const auth = require('../middleware/auth');

// ========== GET COMPLETE ANALYTICS DASHBOARD ==========
router.get('/dashboard', auth, async (req, res) => {
    try {
        const { timeframe = 'month' } = req.query;
        
        const startDate = new Date();
        if (timeframe === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (timeframe === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (timeframe === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
        
        // Get habits data
        const habits = await Habit.find({ 
            userId: req.userId,
            createdAt: { $gte: startDate }
        });
        
        // Get journal entries
        const journals = await Journal.find({
            userId: req.userId,
            date: { $gte: startDate }
        }).sort({ date: 1 });
        
        // Get pomodoro sessions
        const pomodoro = await Pomodoro.findOne({ userId: req.userId });
        
        // Calculate completion rate over time
        const completionData = await Habit.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            { $unwind: "$completedDates" },
            { $match: { "completedDates.date": { $gte: startDate } } },
            { $group: {
                _id: { 
                    $dateToString: { format: "%Y-%m-%d", date: "$completedDates.date" }
                },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);
        
        // Category breakdown
        const categoryBreakdown = {};
        habits.forEach(habit => {
            const cat = habit.category || 'other';
            if (!categoryBreakdown[cat]) {
                categoryBreakdown[cat] = {
                    total: 0,
                    completed: 0,
                    streak: 0
                };
            }
            categoryBreakdown[cat].total += 1;
            categoryBreakdown[cat].completed += habit.statistics?.totalCompletions || 0;
            categoryBreakdown[cat].streak = Math.max(
                categoryBreakdown[cat].streak,
                habit.statistics?.streak || 0
            );
        });
        
        // Best time of day analysis
        const timeAnalysis = await Habit.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            { $unwind: "$completedDates" },
            { $group: {
                _id: { $hour: "$completedDates.date" },
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        // Mood correlation
        const moodCorrelation = await Journal.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId), date: { $gte: startDate } } },
            { $lookup: {
                from: 'habits',
                localField: 'habitsCompleted.habitId',
                foreignField: '_id',
                as: 'habitDetails'
            }},
            { $project: {
                mood: 1,
                productivity: 1,
                habitsCompleted: { $size: "$habitsCompleted" }
            }}
        ]);
        
        // Predictions (simple linear regression)
        let predictedNextWeek = 0;
        if (completionData.length > 7) {
            const last7Days = completionData.slice(-7);
            const avg = last7Days.reduce((sum, d) => sum + d.count, 0) / 7;
            const trend = last7Days.length > 1 ? (last7Days[last7Days.length-1].count - last7Days[0].count) / 7 : 0;
            predictedNextWeek = Math.round(avg + trend * 7);
        }
        
        res.json({
            timeframe,
            summary: {
                totalHabits: habits.length,
                totalCompletions: habits.reduce((sum, h) => sum + (h.statistics?.totalCompletions || 0), 0),
                currentStreak: habits.reduce((max, h) => Math.max(max, h.statistics?.streak || 0), 0),
                averageSuccessRate: habits.length > 0 
                    ? Math.round(habits.reduce((sum, h) => sum + (h.statistics?.successRate || 0), 0) / habits.length)
                    : 0
            },
            completionData,
            categoryBreakdown,
            timeAnalysis,
            moodCorrelation,
            journalEntries: journals,
            pomodoroStats: pomodoro?.statistics || null,
            predictions: {
                nextWeek: predictedNextWeek,
                confidence: completionData.length > 30 ? 'high' : 'medium'
            }
        });
        
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== GET PRODUCTIVITY INSIGHTS ==========
router.get('/insights', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const habits = await Habit.find({ userId: req.userId });
        
        const insights = [];
        
        // Analyze best performing habits
        const bestHabits = habits
            .filter(h => h.statistics?.successRate > 80)
            .map(h => h.title);
        
        if (bestHabits.length > 0) {
            insights.push({
                type: 'positive',
                title: '🌟 Star Performers',
                message: `You're crushing it with: ${bestHabits.slice(0, 3).join(', ')}`,
                recommendation: 'Try increasing frequency or difficulty'
            });
        }
        
        // Analyze struggling habits
        const strugglingHabits = habits
            .filter(h => h.statistics?.successRate < 30)
            .map(h => h.title);
        
        if (strugglingHabits.length > 0) {
            insights.push({
                type: 'warning',
                title: '⚠️ Needs Attention',
                message: `These habits need focus: ${strugglingHabits.slice(0, 3).join(', ')}`,
                recommendation: 'Consider adjusting time or breaking into smaller steps'
            });
        }
        
        // Streak analysis
        const longestStreak = Math.max(...habits.map(h => h.statistics?.streak || 0));
        if (longestStreak > 7) {
            insights.push({
                type: 'achievement',
                title: '🔥 Streak Master',
                message: `You have a ${longestStreak} day streak going!`,
                recommendation: 'Keep it up! Share your achievement with friends'
            });
        }
        
        // Time of day analysis
        const morningCompletions = habits.reduce((sum, h) => {
            return sum + (h.completedDates?.filter(c => {
                const hour = new Date(c.date).getHours();
                return hour >= 5 && hour < 12;
            }).length || 0);
        }, 0);
        
        const eveningCompletions = habits.reduce((sum, h) => {
            return sum + (h.completedDates?.filter(c => {
                const hour = new Date(c.date).getHours();
                return hour >= 18 || hour < 5;
            }).length || 0);
        }, 0);
        
        if (morningCompletions > eveningCompletions * 1.5) {
            insights.push({
                type: 'insight',
                title: '🌅 Morning Person',
                message: 'You\'re most productive in the mornings',
                recommendation: 'Schedule important habits before noon'
            });
        } else if (eveningCompletions > morningCompletions * 1.5) {
            insights.push({
                type: 'insight',
                title: '🌙 Night Owl',
                message: 'You\'re most productive in the evenings',
                recommendation: 'Save creative work for night time'
            });
        }
        
        // Total completions insight
        const totalCompletions = habits.reduce((sum, h) => sum + (h.statistics?.totalCompletions || 0), 0);
        if (totalCompletions > 100) {
            insights.push({
                type: 'achievement',
                title: '🎯 Century Club',
                message: `You've completed ${totalCompletions} habits total!`,
                recommendation: 'You\'re a habit master now!'
            });
        }
        
        res.json(insights);
        
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ========== EXPORT DATA ==========
router.get('/export/:format', auth, async (req, res) => {
    try {
        const { format } = req.params; // 'csv', 'json'
        
        const habits = await Habit.find({ userId: req.userId });
        const journals = await Journal.find({ userId: req.userId });
        const user = await User.findById(req.userId).select('-password');
        
        const data = {
            user: {
                username: user.username,
                email: user.email,
                joinedAt: user.createdAt,
                stats: user.stats,
                streak: user.streak
            },
            habits: habits.map(h => ({
                title: h.title,
                category: h.category,
                createdAt: h.createdAt,
                completions: h.completedDates.length,
                streak: h.statistics?.streak || 0
            })),
            journals: journals.map(j => ({
                date: j.date,
                mood: j.mood,
                notes: j.notes
            }))
        };
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=dailyup-export.json');
            return res.json(data);
        }
        
        if (format === 'csv') {
            let csv = 'Type,Name,Date,Value\n';
            
            habits.forEach(h => {
                h.completedDates.forEach(c => {
                    csv += `Habit,${h.title},${new Date(c.date).toLocaleDateString()},Completed\n`;
                });
            });
            
            journals.forEach(j => {
                csv += `Journal,Mood,${new Date(j.date).toLocaleDateString()},${j.mood}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=dailyup-export.csv');
            return res.send(csv);
        }
        
        res.json({ message: 'Export format not supported' });
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;