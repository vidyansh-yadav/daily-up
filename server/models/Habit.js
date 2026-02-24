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
        enum: ['coding', 'fitness', 'learning', 'productivity', 'health', 'school', 'other'],
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
        monday: { type: Boolean, default: true },
        tuesday: { type: Boolean, default: true },
        wednesday: { type: Boolean, default: true },
        thursday: { type: Boolean, default: true },
        friday: { type: Boolean, default: true },
        saturday: { type: Boolean, default: true },
        sunday: { type: Boolean, default: true }
    },
    timeSlot: {
        startTime: String, // Format: "HH:MM"
        endTime: String,   // Format: "HH:MM"
        period: String     // AM/PM
    },
    reminders: [Date],
    completedDates: [{
        date: { type: Date, required: true },
        timeSpent: { type: Number, default: 0 }, // in minutes
        notes: String
    }],
    statistics: {
        totalCompletions: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
    },
    isSchoolSubject: { type: Boolean, default: false },
    subjectCode: String, // e.g., "MATH101", "PHY202"
    grade: String,
    createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
habitSchema.index({ userId: 1, createdAt: -1 });
habitSchema.index({ userId: 1, 'completedDates.date': -1 });

module.exports = mongoose.model('Habit', habitSchema);