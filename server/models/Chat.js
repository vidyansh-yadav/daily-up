const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    user: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        isAdmin: { type: Boolean, default: false }
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    replies: [{
        user: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: String,
            isAdmin: Boolean
        },
        message: String,
        createdAt: { type: Date, default: Date.now }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
chatSchema.index({ createdAt: -1 });
chatSchema.index({ 'user.userId': 1 });

module.exports = mongoose.model('Chat', chatSchema);