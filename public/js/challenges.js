// ==========================================
// CHALLENGES SYSTEM - COMPLETE WORKING VERSION
// With Real Data from Database
// Developed by: UNSEEN-TERMINATION
// ==========================================

class ChallengesSystem {
    constructor() {
        this.user = null;
        this.challenges = [];
        this.currentFilter = 'active';
        this.apiUrl = window.location.origin + '/api';
        
        this.checkAuth();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
            window.location.href = '/intro';
            return;
        }

        try {
            this.user = JSON.parse(userStr);
            this.init();
        } catch (e) {
            window.location.href = '/intro';
        }
    }

    async init() {
        try {
            this.updateUserInfo();
            await this.loadChallenges();
            this.setupEventListeners();
            
            console.log('✅ Challenges system ready');
        } catch (error) {
            console.error('Challenges initialization error:', error);
            this.showError('Failed to load challenges');
        }
    }

    updateUserInfo() {
        const elements = {
            'username': this.user?.username || 'User',
            'userEmail': this.user?.email || '',
            'streakCount': `${this.user?.streak?.current || 0} day streak`,
            'todayCompleted': this.user?.stats?.totalCompletions || '0',
            'totalHabits': '0'
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
    }

    async loadChallenges() {
        try {
            console.log('Loading challenges with filter:', this.currentFilter);
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/social/challenges?type=${this.currentFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.challenges = await res.json();
                console.log(`Loaded ${this.challenges.length} challenges`);
                this.renderChallenges();
            } else {
                const error = await res.text();
                console.error('Failed to load challenges:', error);
                this.showError('Failed to load challenges from server');
            }
        } catch (error) {
            console.error('Failed to load challenges:', error);
            this.showError('Network error - check server connection');
        }
    }

    async createChallenge() {
        const name = document.getElementById('challengeName')?.value;
        const description = document.getElementById('challengeDescription')?.value;
        const category = document.getElementById('challengeCategory')?.value;
        const type = document.getElementById('challengeType')?.value;
        const goalType = document.getElementById('goalType')?.value;
        const goalTarget = parseInt(document.getElementById('goalTarget')?.value) || 7;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        const rewardXP = parseInt(document.getElementById('rewardXP')?.value) || 500;

        if (!name || !description) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }

        const challengeData = {
            name: name,
            description: description,
            category: category,
            type: type,
            goal: {
                type: goalType,
                target: goalTarget
            },
            duration: {
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            },
            rewards: {
                xp: rewardXP
            }
        };

        try {
            console.log('Creating challenge:', challengeData);
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/social/challenges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(challengeData)
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Challenge created:', data);
                this.showNotification('Challenge created successfully!', 'success');
                document.getElementById('createChallengeModal').style.display = 'none';
                document.getElementById('challengeForm').reset();
                this.loadChallenges();
            } else {
                const err = await res.json();
                console.error('Server error:', err);
                this.showNotification(err.error || 'Failed to create challenge', 'error');
            }
        } catch (error) {
            console.error('Create challenge error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    async joinChallenge(challengeId) {
        try {
            console.log('Joining challenge:', challengeId);
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/social/challenges/${challengeId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                this.showNotification('Joined challenge successfully!', 'success');
                this.loadChallenges();
            } else {
                const err = await res.json();
                console.error('Server error:', err);
                this.showNotification(err.error || 'Failed to join challenge', 'error');
            }
        } catch (error) {
            console.error('Join challenge error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    renderChallenges() {
        const grid = document.getElementById('challengesGrid');
        if (!grid) return;

        if (this.challenges.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-trophy" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-color); margin-bottom: 0.5rem;">No challenges found</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Create a challenge to get started!</p>
                    <button class="btn-create" onclick="challenges.showCreateModal()" style="margin: 0 auto;">
                        <i class="fas fa-plus"></i> Create Your First Challenge
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.challenges.map(challenge => {
            const userProgress = challenge.participants?.find(p => p.user?._id === this.user?.id)?.progress || 0;
            const progress = challenge.goal?.target ? (userProgress / challenge.goal.target) * 100 : 0;
            const isJoined = challenge.participants?.some(p => p.user?._id === this.user?.id);
            const isCreator = challenge.creator?._id === this.user?.id;
            
            const startDate = new Date(challenge.duration?.startDate).toLocaleDateString();
            const endDate = new Date(challenge.duration?.endDate).toLocaleDateString();
            
            return `
                <div class="challenge-card">
                    <div class="challenge-header">
                        <span class="challenge-category">${challenge.category || 'custom'}</span>
                        <span class="challenge-status status-${challenge.status || 'active'}">${challenge.status || 'active'}</span>
                    </div>
                    <h3 style="margin: 0.5rem 0; color: var(--primary-color);">${challenge.name}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1rem; font-size: 0.9rem;">${challenge.description}</p>
                    
                    <div class="challenge-progress">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                            <span>Progress</span>
                            <span style="color: var(--primary-color);">${userProgress}/${challenge.goal?.target || 0}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="participants-list">
                        ${challenge.participants?.slice(0, 5).map(p => `
                            <div class="participant-avatar" title="${p.user?.username || 'Participant'}">
                                <i class="fas fa-user"></i>
                            </div>
                        `).join('')}
                        ${challenge.participants?.length > 5 ? `<span style="margin-left: 0.5rem; color: var(--text-muted);">+${challenge.participants.length - 5}</span>` : ''}
                    </div>
                    
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin: 0.5rem 0;">
                        <i class="fas fa-calendar"></i> ${startDate} - ${endDate}
                    </div>
                    
                    <div class="challenge-footer">
                        <span class="challenge-reward">
                            <i class="fas fa-star"></i> ${challenge.rewards?.xp || 500} XP
                        </span>
                        ${isCreator ? 
                            '<span style="color: var(--primary-color);"><i class="fas fa-crown"></i> Creator</span>' : 
                            isJoined ? 
                                '<span style="color: var(--primary-color);"><i class="fas fa-check"></i> Joined</span>' : 
                                `<button class="btn-join" onclick="challenges.joinChallenge('${challenge._id}')">
                                    <i class="fas fa-plus"></i> Join Challenge
                                </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    showCreateModal() {
        const modal = document.getElementById('createChallengeModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Set default dates
            const today = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            if (startDateInput) {
                startDateInput.value = today.toISOString().split('T')[0];
            }
            if (endDateInput) {
                endDateInput.value = nextMonth.toISOString().split('T')[0];
            }
        }
    }

    hideCreateModal() {
        const modal = document.getElementById('createChallengeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.loadChallenges();
            });
        });

        // Create challenge button
        const createBtn = document.getElementById('createChallengeBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Close modal buttons
        const closeModal = document.getElementById('closeChallengeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideCreateModal());
        }

        const cancelBtn = document.getElementById('cancelChallengeBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreateModal());
        }

        // Challenge form submit
        const challengeForm = document.getElementById('challengeForm');
        if (challengeForm) {
            challengeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createChallenge();
            });
        }

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('createChallengeModal');
            if (e.target === modal) {
                this.hideCreateModal();
            }
        });

        // User menu
        const menuBtn = document.getElementById('userMenuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('userDropdown')?.classList.toggle('show');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '/intro';
            });
        }

        // Close dropdown on outside click
        document.addEventListener('click', () => {
            document.getElementById('userDropdown')?.classList.remove('show');
        });
    }

    showNotification(msg, type) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${type === 'success' ? '#00ff00' : type === 'error' ? '#ff3333' : '#00ccff'};
            color: #000; padding: 12px 20px; border-radius: 4px;
            font-family: 'Courier New', monospace;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            z-index: 10000;
        `;
        notif.textContent = msg;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    showError(msg) {
        const container = document.getElementById('challengesGrid');
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff3333; margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-color); margin-bottom: 0.5rem;">${msg}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Please try again later.</p>
                    <button onclick="location.reload()" style="
                        background: #00ff00;
                        color: black;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Retry</button>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.challenges = new ChallengesSystem();
});