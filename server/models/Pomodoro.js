const mongoose = require('mongoose');

const pomodoroSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    habitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
    },
    date: {
        type: Date,
        default: Date.now
    },
    sessions: [{
        startTime: Date,
        endTime: Date,
        duration: Number, // in minutes
        completed: { type: Boolean, default: false },
        interrupted: { type: Boolean, default: false },
        focusLevel: { // 1-10
            type: Number,
            min: 1,
            max: 10
        },
        notes: String
    }],
    settings: {
        workDuration: { type: Number, default: 25 }, // minutes
        shortBreakDuration: { type: Number, default: 5 },
        longBreakDuration: { type: Number, default: 15 },
        sessionsBeforeLongBreak: { type: Number, default: 4 },
        autoStartBreaks: { type: Boolean, default: true },
        soundEnabled: { type: Boolean, default: true },
        theme: { type: String, default: 'classic' }
    },
    statistics: {
        totalSessions: { type: Number, default: 0 },
        totalFocusTime: { type: Number, default: 0 }, // minutes
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        bestDay: { type: Number, default: 0 },
        weeklyAverage: { type: Number, default: 0 },
        monthlyTotal: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Update statistics after session
pomodoroSchema.methods.updateStats = async function(session) {
    this.statistics.totalSessions += 1;
    this.statistics.totalFocusTime += session.duration;
    
    // Check if this is the best day
    const today = new Date().toDateString();
    const todaySessions = this.sessions.filter(s => 
        new Date(s.startTime).toDateString() === today
    );
    
    const todayTotal = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    if (todayTotal > this.statistics.bestDay) {
        this.statistics.bestDay = todayTotal;
    }
    
    // Calculate weekly average
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = this.sessions.filter(s => 
        new Date(s.startTime) >= weekAgo
    );
    
    const weekTotal = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    this.statistics.weeklyAverage = Math.round(weekTotal / 7);
    
    await this.save();
};

// Get productivity insights
pomodoroSchema.statics.getInsights = async function(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const data = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), date: { $gte: startDate } } },
        { $unwind: "$sessions" },
        { $match: { "sessions.startTime": { $gte: startDate } } },
        { $group: {
            _id: { 
                hour: { $hour: "$sessions.startTime" },
                dayOfWeek: { $dayOfWeek: "$sessions.startTime" }
            },
            totalSessions: { $sum: 1 },
            totalTime: { $sum: "$sessions.duration" },
            avgFocus: { $avg: "$sessions.focusLevel" }
        }},
        { $sort: { totalTime: -1 } }
    ]);
    
    return {
        bestTime: data[0] || null,
        productivity: data,
        total: data.reduce((sum, d) => sum + d.totalTime, 0)
    };
};

module.exports = mongoose.model('Pomodoro', pomodoroSchema);