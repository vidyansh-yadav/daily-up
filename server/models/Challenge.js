const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['fitness', 'coding', 'reading', 'meditation', 'custom'],
        default: 'custom'
    },
    goal: {
        type: {
            type: String,
            enum: ['streak', 'completions', 'minutes'],
            default: 'streak'
        },
        target: { type: Number, default: 7 }
    },
    duration: {
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) }
    },
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }
    }],
    rewards: {
        xp: { type: Number, default: 500 }
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Challenge', challengeSchema);