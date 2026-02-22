const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['coding', 'fitness', 'learning', 'productivity', 'health', 'other'],
        default: 'productivity'
    },
    description: String,
    color: {
        type: String,
        default: '#00ff00'
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    schedule: {
        type: Map,
        of: Boolean,
        default: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
        }
    },
    timeSlot: {
        hour: Number,
        minute: Number,
        period: String // AM/PM
    },
    reminders: [Date],
    completedDates: [{
        date: Date,
        timeSpent: Number, // in minutes
        notes: String
    }],
    statistics: {
        totalCompletions: {
            type: Number,
            default: 0
        },
        streak: {
            type: Number,
            default: 0
        },
        longestStreak: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
habitSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Habit', habitSchema);