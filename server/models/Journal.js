const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    mood: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    energy: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    stress: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    productivity: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    notes: {
        type: String,
        maxlength: 2000
    },
    gratitude: [{
        type: String,
        maxlength: 200
    }],
    habitsCompleted: [{
        habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
        habitName: String,
        completedAt: Date
    }],
    reflections: {
        wins: String,
        challenges: String,
        learnings: String,
        tomorrow: String
    },
    tags: [String],
    attachments: [{
        url: String,
        type: String // 'image', 'audio', 'file'
    }]
}, {
    timestamps: true
});

// Index for faster queries
journalSchema.index({ userId: 1, date: -1 });
journalSchema.index({ userId: 1, mood: 1 });

// Get mood trends
journalSchema.statics.getMoodTrends = async function(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), date: { $gte: startDate } } },
        { $sort: { date: 1 } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            avgMood: { $avg: "$mood" },
            avgEnergy: { $avg: "$energy" },
            avgProductivity: { $avg: "$productivity" },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ]);
};

module.exports = mongoose.model('Journal', journalSchema);