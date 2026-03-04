// ==========================================
// GAMIFICATION SYSTEM - FRONTEND
// Manages XP, Levels, Badges & Achievements
// Developed by: UNSEEN-TERMINATION
// ==========================================

class GamificationSystem {
    constructor() {
        this.user = null;
        this.gamification = null;
        this.achievements = [];
        this.badges = [];
        this.leaderboard = [];
        this.apiUrl = window.location.origin + '/api';
        
        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            await this.loadGamification();
            await this.loadLeaderboard();
            this.setupEventListeners();
            
            console.log('✅ Gamification system ready');
        } catch (error) {
            console.error('Gamification initialization error:', error);
        }
    }

    loadUserData() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                this.user = JSON.parse(userStr);
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }

    async loadGamification() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/gamification/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                this.gamification = data.gamification;
                this.achievements = data.achievements || [];
                this.badges = data.gamification?.badges || [];
                
                this.updateUI();
                console.log('📊 Gamification data loaded:', this.gamification);
            } else {
                console.error('Failed to load gamification:', await res.text());
            }
        } catch (error) {
            console.error('Error loading gamification:', error);
        }
    }

    async loadLeaderboard(timeframe = 'weekly') {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/gamification/leaderboard?timeframe=${timeframe}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.leaderboard = await res.json();
                this.renderLeaderboard();
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    }

    updateUI() {
        this.updateLevelDisplay();
        this.updateXPBar();
        this.updateBadges();
        this.updateAchievements();
    }

    updateLevelDisplay() {
        const levelElements = document.querySelectorAll('.user-level, #userLevel, .level-display');
        levelElements.forEach(el => {
            if (el) {
                el.innerHTML = `
                    <div class="level-badge">
                        <i class="fas fa-star"></i>
                        <span>Level ${this.gamification?.level || 1}</span>
                    </div>
                `;
            }
        });
    }

    updateXPBar() {
        const xpBars = document.querySelectorAll('.xp-bar-container, #xpBar');
        xpBars.forEach(container => {
            if (!container) return;
            
            const currentXP = this.gamification?.xp || 0;
            const nextLevelXP = this.gamification?.xpToNextLevel || 100;
            const percentage = Math.min(100, (currentXP / nextLevelXP) * 100);
            
            container.innerHTML = `
                <div class="xp-bar">
                    <div class="xp-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="xp-stats">
                    <span class="xp-current">${currentXP} XP</span>
                    <span class="xp-next">Next: ${nextLevelXP} XP</span>
                </div>
            `;
        });
    }

    updateBadges() {
        const badgesContainer = document.getElementById('badgesContainer');
        if (!badgesContainer) return;

        if (!this.badges || this.badges.length === 0) {
            badgesContainer.innerHTML = '<p class="no-badges">No badges yet. Keep going!</p>';
            return;
        }

        badgesContainer.innerHTML = this.badges.slice(0, 6).map(badge => `
            <div class="badge-card" title="${badge.description || badge.name}">
                <div class="badge-icon">
                    <i class="${badge.icon || 'fas fa-medal'}"></i>
                </div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-date">${new Date(badge.earnedAt).toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    updateAchievements() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) return;

        if (!this.achievements || this.achievements.length === 0) {
            achievementsGrid.innerHTML = '<p class="no-achievements">No achievements yet. Complete habits to earn achievements!</p>';
            return;
        }

        achievementsGrid.innerHTML = this.achievements.map(ach => `
            <div class="achievement-card completed">
                <div class="achievement-icon">
                    <i class="${ach.achievement?.icon || 'fas fa-trophy'}"></i>
                </div>
                <div class="achievement-info">
                    <h4>${ach.achievement?.name || 'Achievement'}</h4>
                    <p>${ach.achievement?.description || ''}</p>
                </div>
                <div class="achievement-date">
                    ${new Date(ach.completedAt).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }

    renderLeaderboard() {
        const leaderboardEl = document.getElementById('leaderboardList');
        if (!leaderboardEl) return;

        if (!this.leaderboard || this.leaderboard.length === 0) {
            leaderboardEl.innerHTML = '<p class="empty-state">No leaderboard data</p>';
            return;
        }

        leaderboardEl.innerHTML = this.leaderboard.map((user, index) => `
            <div class="leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}">
                <div class="rank">#${index + 1}</div>
                <div class="user-info">
                    <div class="username">${user.username || 'Anonymous'}</div>
                    <div class="user-stats">
                        <span class="level">Level ${user.gamification?.level || 1}</span>
                        <span class="xp">${user.gamification?.totalXpEarned || 0} XP</span>
                    </div>
                </div>
                ${index < 3 ? `<div class="crown"><i class="fas fa-crown"></i></div>` : ''}
            </div>
        `).join('');
    }

    // Call this when habit is completed
    async addXP(amount, reason = 'Habit completed') {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/gamification/add-xp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount, reason })
            });

            if (res.ok) {
                const data = await res.json();
                
                // Update local data
                if (this.gamification) {
                    this.gamification.xp = data.gamification.xp;
                    this.gamification.level = data.gamification.level;
                    this.gamification.xpToNextLevel = data.gamification.xpToNextLevel;
                }
                
                this.updateUI();
                
                // Show level up animation if needed
                if (data.leveledUp) {
                    this.showLevelUp(data.newLevel);
                }
                
                return data;
            } else {
                console.error('Failed to add XP:', await res.text());
            }
        } catch (error) {
            console.error('Error adding XP:', error);
        }
    }

    showLevelUp(level) {
        // Create level up animation
        const animation = document.createElement('div');
        animation.className = 'level-up-animation';
        animation.innerHTML = `
            <div class="level-up-content">
                <i class="fas fa-star"></i>
                <h2>LEVEL UP!</h2>
                <p>You are now Level ${level}</p>
            </div>
        `;
        
        document.body.appendChild(animation);
        
        // Play sound if available
        try {
            const audio = new Audio('/sound/levelup.mp3');
            audio.volume = 0.3;
            audio.play();
        } catch (e) {}
        
        // Remove animation after 3 seconds
        setTimeout(() => {
            animation.remove();
        }, 3000);
    }

    setupEventListeners() {
        // Leaderboard timeframe switcher
        const timeframeBtns = document.querySelectorAll('.leaderboard-timeframe button');
        timeframeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                timeframeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadLeaderboard(e.target.dataset.timeframe);
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gamification = new GamificationSystem();
});