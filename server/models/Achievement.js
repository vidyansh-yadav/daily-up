const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    category: {
        type: String,
        enum: ['streak', 'completion', 'social', 'mastery', 'special'],
        required: true
    },
    icon: String,
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    xpReward: Number,
    requirements: {
        type: {
            type: String,
            enum: ['streak', 'count', 'time', 'social'],
            required: true
        },
        target: Number,
        unit: String,
        habitCategory: String
    },
    progression: {
        steps: [{
            name: String,
            target: Number,
            reward: Number
        }]
    },
    unlockedBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        unlockedAt: Date
    }],
    createdAt: { type: Date, default: Date.now }
});

// Get achievement progress for user
achievementSchema.statics.getUserProgress = async function(userId) {
    const achievements = await this.find();
    const user = await mongoose.model('User').findById(userId);
    const habits = await mongoose.model('Habit').find({ userId });
    
    const progress = [];
    
    for (const achievement of achievements) {
        let currentProgress = 0;
        let completed = false;
        
        switch (achievement.requirements.type) {
            case 'streak':
                currentProgress = user.streak.current;
                completed = currentProgress >= achievement.requirements.target;
                break;
                
            case 'count':
                if (achievement.requirements.habitCategory) {
                    currentProgress = habits
                        .filter(h => h.category === achievement.requirements.habitCategory)
                        .reduce((sum, h) => sum + h.statistics.totalCompletions, 0);
                } else {
                    currentProgress = user.stats.totalCompletions;
                }
                completed = currentProgress >= achievement.requirements.target;
                break;
                
            case 'time':
                currentProgress = Math.floor(user.stats.totalTimeSpent / 60); // hours
                completed = currentProgress >= achievement.requirements.target;
                break;
        }
        
        progress.push({
            achievement,
            currentProgress,
            completed,
            percentage: Math.min(100, Math.round((currentProgress / achievement.requirements.target) * 100))
        });
    }
    
    return progress;
};

module.exports = mongoose.model('Achievement', achievementSchema);