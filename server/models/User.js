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
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
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
    gamification: {
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        xpToNextLevel: { type: Number, default: 100 },
        totalXpEarned: { type: Number, default: 0 },
        badges: [{
            name: String,
            icon: String,
            description: String,
            earnedAt: { type: Date, default: Date.now }
        }],
        achievements: [{
            title: String,
            description: String,
            progress: { type: Number, default: 0 },
            target: Number,
            completed: { type: Boolean, default: false },
            completedAt: Date,
            xpReward: Number
        }]
    },
    social: {
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        friendRequests: [{
            from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending', 'accepted', 'rejected'] },
            createdAt: { type: Date, default: Date.now }
        }],
        privacy: {
            showProfile: { type: Boolean, default: true },
            showStreak: { type: Boolean, default: true },
            showHabits: { type: Boolean, default: false }
        }
    },
    preferences: {
        theme: { type: String, default: 'hacker' },
        soundEffects: { type: Boolean, default: true },
        dailyGoal: { type: Number, default: 5 },
        focusMode: { type: Boolean, default: false },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' }
    },
    stats: {
        totalCompletions: { type: Number, default: 0 },
        totalTimeSpent: { type: Number, default: 0 }, // minutes
        bestStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        consistencyScore: { type: Number, default: 0 },
        joinDate: { type: Date, default: Date.now }
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

// ========== METHODS ==========

// Method to add XP
userSchema.methods.addXP = async function(amount) {
    if (!this.gamification) {
        this.gamification = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalXpEarned: 0,
            badges: [],
            achievements: []
        };
    }
    
    this.gamification.xp += amount;
    this.gamification.totalXpEarned += amount;
    
    // Level up logic
    let leveledUp = false;
    while (this.gamification.xp >= this.gamification.xpToNextLevel) {
        this.gamification.level += 1;
        this.gamification.xp -= this.gamification.xpToNextLevel;
        this.gamification.xpToNextLevel = Math.floor(this.gamification.xpToNextLevel * 1.5);
        leveledUp = true;
        
        // Award level up badge
        if (!this.gamification.badges) this.gamification.badges = [];
        this.gamification.badges.push({
            name: `Level ${this.gamification.level} Achieved`,
            icon: 'fas fa-level-up-alt',
            description: `Reached level ${this.gamification.level}`,
            earnedAt: new Date()
        });
    }
    
    await this.save();
    return { gamification: this.gamification, leveledUp, newLevel: this.gamification.level };
};

// Method to check achievements
userSchema.methods.checkAchievements = async function() {
    if (!this.gamification) {
        this.gamification = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalXpEarned: 0,
            badges: [],
            achievements: []
        };
    }
    
    if (!this.gamification.achievements) {
        this.gamification.achievements = [];
    }
    
    const achievements = [];
    
    // Streak achievements
    if (this.streak.current >= 7 && !this.hasAchievement('7 Day Streak')) {
        achievements.push({
            title: '7 Day Streak',
            description: 'Maintained a streak for 7 days',
            icon: 'fas fa-fire',
            xpReward: 100
        });
    }
    
    if (this.streak.current >= 30 && !this.hasAchievement('30 Day Streak')) {
        achievements.push({
            title: '30 Day Streak',
            description: 'Maintained a streak for 30 days',
            icon: 'fas fa-crown',
            xpReward: 500
        });
    }
    
    if (this.streak.current >= 100 && !this.hasAchievement('Century Streak')) {
        achievements.push({
            title: 'Century Streak',
            description: 'Maintained a streak for 100 days',
            icon: 'fas fa-dragon',
            xpReward: 2000
        });
    }
    
    // Habit count achievements
    const Habit = mongoose.model('Habit');
    const habitCount = await Habit.countDocuments({ userId: this._id });
    
    if (habitCount >= 5 && !this.hasAchievement('Habit Starter')) {
        achievements.push({
            title: 'Habit Starter',
            description: 'Created 5 habits',
            icon: 'fas fa-seedling',
            xpReward: 50
        });
    }
    
    if (habitCount >= 10 && !this.hasAchievement('Habit Master')) {
        achievements.push({
            title: 'Habit Master',
            description: 'Created 10 habits',
            icon: 'fas fa-tasks',
            xpReward: 200
        });
    }
    
    if (habitCount >= 20 && !this.hasAchievement('Habit Legend')) {
        achievements.push({
            title: 'Habit Legend',
            description: 'Created 20 habits',
            icon: 'fas fa-crown',
            xpReward: 500
        });
    }
    
    // Completion achievements
    if (!this.stats) this.stats = { totalCompletions: 0 };
    
    if (this.stats.totalCompletions >= 50 && !this.hasAchievement('Bronze Member')) {
        achievements.push({
            title: 'Bronze Member',
            description: 'Completed 50 habits',
            icon: 'fas fa-medal',
            xpReward: 150
        });
    }
    
    if (this.stats.totalCompletions >= 100 && !this.hasAchievement('Century Club')) {
        achievements.push({
            title: 'Century Club',
            description: 'Completed 100 habits',
            icon: 'fas fa-star',
            xpReward: 1000
        });
    }
    
    if (this.stats.totalCompletions >= 500 && !this.hasAchievement('Legendary')) {
        achievements.push({
            title: 'Legendary',
            description: 'Completed 500 habits',
            icon: 'fas fa-skull',
            xpReward: 5000
        });
    }
    
    // First habit achievement
    if (habitCount >= 1 && !this.hasAchievement('First Step')) {
        achievements.push({
            title: 'First Step',
            description: 'Created your first habit',
            icon: 'fas fa-shoe-prints',
            xpReward: 25
        });
    }
    
    // First completion achievement
    if (this.stats.totalCompletions >= 1 && !this.hasAchievement('First Victory')) {
        achievements.push({
            title: 'First Victory',
            description: 'Completed your first habit',
            icon: 'fas fa-trophy',
            xpReward: 25
        });
    }
    
    for (const achievement of achievements) {
        await this.addAchievement(achievement);
    }
    
    return achievements;
};

userSchema.methods.hasAchievement = function(title) {
    if (!this.gamification || !this.gamification.achievements) return false;
    return this.gamification.achievements.some(a => a.title === title);
};

userSchema.methods.addAchievement = async function(achievement) {
    if (!this.gamification) {
        this.gamification = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalXpEarned: 0,
            badges: [],
            achievements: []
        };
    }
    
    if (!this.gamification.achievements) {
        this.gamification.achievements = [];
    }
    
    this.gamification.achievements.push({
        ...achievement,
        completed: true,
        completedAt: new Date()
    });
    
    // Add XP for achievement
    await this.addXP(achievement.xpReward);
    
    // Add badge for achievement
    if (!this.gamification.badges) this.gamification.badges = [];
    this.gamification.badges.push({
        name: achievement.title,
        icon: achievement.icon || 'fas fa-medal',
        description: achievement.description,
        earnedAt: new Date()
    });
    
    await this.save();
};

// Method to update stats
userSchema.methods.updateStats = async function(habitCompleted, timeSpent = 30) {
    if (!this.stats) {
        this.stats = {
            totalCompletions: 0,
            totalTimeSpent: 0,
            bestStreak: 0,
            longestStreak: 0,
            consistencyScore: 0,
            joinDate: this.createdAt || new Date()
        };
    }
    
    this.stats.totalCompletions += 1;
    this.stats.totalTimeSpent += timeSpent;
    
    if (this.streak.current > this.stats.bestStreak) {
        this.stats.bestStreak = this.streak.current;
    }
    
    if (this.streak.longest > this.stats.longestStreak) {
        this.stats.longestStreak = this.streak.longest;
    }
    
    // Calculate consistency score (simplified)
    const daysSinceJoin = Math.ceil((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceJoin > 0) {
        this.stats.consistencyScore = Math.min(100, Math.round((this.stats.totalCompletions / daysSinceJoin) * 10));
    }
    
    await this.save();
};

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'gamification.level': -1 });
userSchema.index({ 'streak.current': -1 });

module.exports = mongoose.model('User', userSchema);