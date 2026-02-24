const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // Password not returned in queries by default
    },
    profile: {
        name: { type: String, default: '' },
        bio: { type: String, default: '', maxlength: 500 },
        skills: { type: [String], default: [] },
        dailyGoal: { type: Number, default: 5, min: 1, max: 24 },
        avatar: { type: String, default: '' },
        school: {
            name: { type: String, default: '' },
            grade: String,
            studentId: String
        }
    },
    streak: {
        current: { type: Number, default: 0, min: 0 },
        longest: { type: Number, default: 0, min: 0 },
        lastActive: { type: Date, default: null }
    },
    settings: {
        theme: { type: String, default: 'hacker', enum: ['hacker', 'light', 'dark'] },
        notifications: { type: Boolean, default: true },
        emailReports: { type: Boolean, default: false },
        twoFactorAuth: { type: Boolean, default: false }
    },
    security: {
        lastLogin: { type: Date, default: null },
        lastIp: { type: String, default: '' },
        loginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
        passwordChangedAt: { type: Date, default: Date.now },
        resetPasswordToken: String,
        resetPasswordExpires: Date
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);