// ==========================================
// DASHBOARD.JS - REAL DATABASE VERSION
// Developed by: UNSEEN-TERMINATION
// ==========================================

class Dashboard {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('user')) || null;
        this.habits = [];
        this.stats = {};
        this.apiUrl = window.location.origin + '/api'; // Works on localhost and render
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing dashboard with REAL data...');
        
        // Check if user is logged in
        if (!this.user) {
            window.location.href = '/login';
            return;
        }
        
        this.setupEventListeners();
        this.updateUserProfile();
        
        // Load REAL data from database
        await this.loadHabits();
        await this.loadStatistics();
        
        this.setupCharts();
        this.setupCalendar();
        this.setupTimetable();
        
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) loadingScreen.style.display = 'none';
        }, 1000);
        
        // Show motivation popup
        setTimeout(() => {
            this.showMotivationPopup();
        }, 3000);
    }

    async loadHabits() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/habits`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.habits = await response.json();
                console.log('✅ Habits loaded from database:', this.habits.length);
            } else {
                console.error('Failed to load habits');
                this.habits = [];
            }
        } catch (error) {
            console.error('Error loading habits:', error);
            this.habits = [];
        }
        
        this.renderHabits();
    }

    async loadStatistics() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/habits/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.stats = await response.json();
                console.log('✅ Statistics loaded from database:', this.stats);
                this.updateStatsUI();
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            // Fallback stats
            this.stats = {
                totalHabits: this.habits.length,
                completedToday: 0,
                averageSuccessRate: 0,
                weeklyProgress: {
                    'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
                }
            };
        }
    }

    renderHabits() {
        const habitsGrid = document.getElementById('habitsGrid');
        if (!habitsGrid) return;

        if (this.habits.length === 0) {
            habitsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No habits yet</h3>
                    <p>Click "Add Habit" to create your first habit!</p>
                </div>
            `;
            return;
        }

        // Filter today's habits
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const todayHabits = this.habits.filter(habit => {
            return habit.schedule && habit.schedule[dayName] !== false;
        });

        if (todayHabits.length === 0) {
            habitsGrid.innerHTML = `
                <div class="no-habits-today">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No habits scheduled for today</h3>
                    <p>Check your schedule or add new habits</p>
                </div>
            `;
            return;
        }

        habitsGrid.innerHTML = todayHabits.map(habit => {
            const isCompleted = habit.completedDates?.some(date => {
                const compDate = new Date(date.date);
                return compDate.toDateString() === today.toDateString();
            });

            return `
                <div class="habit-card ${isCompleted ? 'completed' : ''}" data-id="${habit._id}">
                    <div class="habit-card-header">
                        <div class="habit-color" style="background: ${habit.color || '#00ff00'}"></div>
                        <h3>${habit.title}</h3>
                        <div class="habit-actions">
                            <button class="btn-action edit-habit" onclick="dashboard.editHabit('${habit._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete-habit" onclick="dashboard.deleteHabit('${habit._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="habit-card-body">
                        ${habit.description ? `<p class="habit-description">${habit.description}</p>` : ''}
                        <div class="habit-meta">
                            <span class="habit-category">${habit.category}</span>
                            <span class="habit-difficulty ${habit.difficulty}">${habit.difficulty}</span>
                            <span class="habit-streak">
                                <i class="fas fa-fire"></i>
                                ${habit.statistics?.streak || 0} days
                            </span>
                        </div>
                    </div>
                    <div class="habit-card-footer">
                        <label class="checkbox-container">
                            <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                                   onchange="dashboard.toggleHabitCompletion('${habit._id}', this.checked)">
                            <span class="checkmark"></span>
                            <span class="checkbox-label">Mark completed</span>
                        </label>
                        ${habit.timeSlot ? `
                            <span class="habit-time">
                                <i class="fas fa-clock"></i>
                                ${this.formatTime(habit.timeSlot)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async toggleHabitCompletion(habitId, completed) {
        if (!completed) return; // Only handle completion, not un-completion
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/habits/${habitId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: new Date().toISOString()
                })
            });

            if (response.ok) {
                this.showNotification('✅ Habit completed!', 'success');
                await this.loadHabits();
                await this.loadStatistics();
                this.updateCharts();
            } else {
                this.showNotification('❌ Failed to complete habit', 'error');
            }
        } catch (error) {
            console.error('Error toggling habit completion:', error);
            this.showNotification('Network error', 'error');
        }
    }

    async addNewHabit() {
        const habitName = document.getElementById('habitName').value;
        if (!habitName) {
            this.showNotification('Please enter habit name', 'error');
            return;
        }

        const habitData = {
            title: habitName,
            category: document.getElementById('habitCategory').value,
            description: document.getElementById('habitDescription').value,
            difficulty: document.getElementById('habitDifficulty').value,
            color: document.getElementById('habitColor').value,
            schedule: {
                monday: document.querySelector('input[name="monday"]')?.checked || false,
                tuesday: document.querySelector('input[name="tuesday"]')?.checked || false,
                wednesday: document.querySelector('input[name="wednesday"]')?.checked || false,
                thursday: document.querySelector('input[name="thursday"]')?.checked || false,
                friday: document.querySelector('input[name="friday"]')?.checked || false,
                saturday: document.querySelector('input[name="saturday"]')?.checked || false,
                sunday: document.querySelector('input[name="sunday"]')?.checked || false
            }
        };

        const habitTime = document.getElementById('habitTime').value;
        if (habitTime) {
            const [hour, minute] = habitTime.split(':');
            habitData.timeSlot = {
                hour: parseInt(hour),
                minute: parseInt(minute),
                period: parseInt(hour) >= 12 ? 'PM' : 'AM'
            };
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/habits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(habitData)
            });

            if (response.ok) {
                this.showNotification('✅ Habit added!', 'success');
                document.getElementById('habitForm').reset();
                document.getElementById('addHabitModal').style.display = 'none';
                await this.loadHabits();
                await this.loadStatistics();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Failed to add habit', 'error');
            }
        } catch (error) {
            console.error('Error adding habit:', error);
            this.showNotification('Network error', 'error');
        }
    }

    async deleteHabit(habitId) {
        if (!confirm('Delete this habit?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/habits/${habitId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.showNotification('✅ Habit deleted', 'success');
                await this.loadHabits();
                await this.loadStatistics();
            } else {
                this.showNotification('Failed to delete habit', 'error');
            }
        } catch (error) {
            console.error('Error deleting habit:', error);
            this.showNotification('Network error', 'error');
        }
    }

    updateStatsUI() {
        document.getElementById('todayCompleted').textContent = this.stats.completedToday || 0;
        document.getElementById('totalHabits').textContent = this.stats.totalHabits || 0;
        
        const totalToday = this.habits.filter(h => {
            const today = new Date();
            const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            return h.schedule && h.schedule[dayName];
        }).length;
        
        document.getElementById('completedCount').textContent = 
            `${this.stats.completedToday || 0}/${totalToday}`;
        document.getElementById('remainingCount').textContent = totalToday - (this.stats.completedToday || 0);
        
        const percent = totalToday > 0 ? Math.round((this.stats.completedToday / totalToday) * 100) : 0;
        document.getElementById('progressPercent').textContent = percent + '%';
        
        // Update progress ring
        const progressRing = document.querySelector('.progress-ring-circle');
        if (progressRing) {
            const dashOffset = 339.292 * (1 - percent / 100);
            progressRing.style.strokeDashoffset = dashOffset;
        }
    }

    setupCharts() {
        this.initWeeklyChart();
    }

    initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        if (window.weeklyChart) {
            window.weeklyChart.destroy();
        }

        const weeklyData = this.stats.weeklyProgress || {
            'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
        };

        window.weeklyChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: Object.keys(weeklyData),
                datasets: [{
                    label: 'Habits Completed',
                    data: Object.values(weeklyData),
                    borderColor: '#00ff00',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#888' } },
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#888' } }
                }
            }
        });
    }

    updateCharts() {
        if (window.weeklyChart) {
            const weeklyData = this.stats.weeklyProgress || {
                'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
            };
            window.weeklyChart.data.datasets[0].data = Object.values(weeklyData);
            window.weeklyChart.update();
        }
    }

    // Keep other methods (setupEventListeners, updateUserProfile, etc.) same as before
    // ... [rest of the methods remain unchanged]
}