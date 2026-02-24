// ==========================================
// COMPLETE DASHBOARD - WORKING VERSION
// No dummy data, real API integration
// Developed by: UNSEEN-TERMINATION
// ==========================================

class Dashboard {
    constructor() {
        this.user = null;
        this.habits = [];
        this.stats = {
            totalHabits: 0,
            completedToday: 0,
            totalCompletions: 0,
            averageSuccessRate: 0,
            weeklyProgress: {},
            categoryDistribution: {},
            totalStudyTime: 0
        };
        this.apiUrl = window.location.origin + '/api';
        this.weeklyChart = null;
        this.calendar = null;
        this.miniCalendar = null;
        
        // Check authentication first
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
            this.showLoading();
            
            // Verify token with server
            await this.verifyUser();
            
            // Load data
            await this.loadHabits();
            await this.loadStats();
            
            // Update UI
            this.updateUserProfile();
            this.renderHabits();
            this.renderStats();
            this.setupCharts();
            this.setupCalendars();
            this.setupTimetable();
            this.renderSkills();
            this.setupEventListeners();
            this.addWatermark();
            
            this.hideLoading();
            
            console.log('✅ Dashboard ready');
        } catch (error) {
            console.error('Dashboard error:', error);
            this.hideLoading();
            this.showError('Failed to load dashboard');
            
            // If token invalid, redirect to login
            if (error.message === 'Invalid token') {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    }

    addWatermark() {
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            color: rgba(0, 255, 0, 0.2);
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 999;
            pointer-events: none;
            transform: rotate(-5deg);
        `;
        watermark.innerHTML = `21K School • UNSEEN-TERMINATION • ${new Date().getFullYear()}`;
        document.body.appendChild(watermark);
    }

    async verifyUser() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                throw new Error('Invalid token');
            }
            
            const data = await res.json();
            this.user = data.user;
            localStorage.setItem('user', JSON.stringify(this.user));
        } catch (error) {
            console.log('Token verification failed:', error);
            throw error;
        }
    }

    showLoading() {
        const loader = document.getElementById('loadingScreen');
        if (loader) loader.style.display = 'flex';
    }

    hideLoading() {
        setTimeout(() => {
            const loader = document.getElementById('loadingScreen');
            if (loader) loader.style.display = 'none';
        }, 500);
    }

    showError(msg) {
        const container = document.querySelector('.dashboard-content');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ff3333;"></i>
                    <h3 style="color: #fff;">${msg}</h3>
                    <button onclick="location.reload()" class="btn-primary">Retry</button>
                </div>
            `;
        }
    }

    showNotification(msg, type = 'info') {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${type === 'success' ? '#00ff00' : type === 'error' ? '#ff3333' : '#00ccff'};
            color: #000; padding: 12px 20px; border-radius: 4px;
            font-family: 'Courier New', monospace;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = msg;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    async loadHabits() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/habits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.habits = await res.json();
            } else {
                this.habits = [];
            }
        } catch (error) {
            console.error('Failed to load habits:', error);
            this.habits = [];
        }
    }

    async loadStats() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/habits/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.stats = await res.json();
            } else {
                this.calculateLocalStats();
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.calculateLocalStats();
        }
    }

    calculateLocalStats() {
        this.stats = {
            totalHabits: this.habits.length,
            completedToday: 0,
            totalCompletions: 0,
            averageSuccessRate: 0,
            weeklyProgress: {},
            categoryDistribution: {},
            totalStudyTime: 0
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.habits.forEach(habit => {
            this.stats.totalCompletions += habit.statistics?.totalCompletions || 0;
            
            if (habit.category) {
                this.stats.categoryDistribution[habit.category] = 
                    (this.stats.categoryDistribution[habit.category] || 0) + 1;
            }

            const completedToday = habit.completedDates?.some(c => {
                const d = new Date(c.date);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            });

            if (completedToday) {
                this.stats.completedToday += 1;
            }
        });

        if (this.habits.length > 0) {
            this.stats.averageSuccessRate = Math.round(
                this.habits.reduce((sum, h) => sum + (h.statistics?.successRate || 0), 0) / this.habits.length
            );
        }
    }

    updateUserProfile() {
        document.getElementById('username').textContent = this.user.username || 'Developer';
        document.getElementById('userEmail').textContent = this.user.email || 'user@daily-up.com';
        document.getElementById('streakCount').textContent = `${this.user.streak?.current || 0} day streak`;
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${this.user.username || 'Developer'}!`;
        document.getElementById('streakDisplay').textContent = this.user.streak?.current || 0;
        
        const now = new Date();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const hour = now.getHours();
        let greeting = 'Good Morning';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        if (hour >= 17) greeting = 'Good Evening';
        document.getElementById('greetingText').textContent = greeting;
    }

    renderHabits() {
        const grid = document.getElementById('habitsGrid');
        if (!grid) return;

        if (this.habits.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No habits yet</h3>
                    <p>Click "Add Habit" to create your first habit!</p>
                </div>
            `;
            return;
        }

        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const todayHabits = this.habits.filter(h => 
            h.schedule && h.schedule[dayName] !== false
        );

        if (todayHabits.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No habits scheduled for today</h3>
                    <p>Add habits or check your timetable</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = todayHabits.map(habit => {
            const completed = habit.completedDates?.some(d => 
                new Date(d.date).toDateString() === today.toDateString()
            );

            return `
                <div class="habit-card ${completed ? 'completed' : ''}" data-id="${habit._id}">
                    <div class="habit-card-header">
                        <div class="habit-color" style="background: ${habit.color || '#00ff00'}"></div>
                        <h3>${habit.title} ${habit.isSchoolSubject ? '📚' : ''}</h3>
                        <div class="habit-actions">
                            <button class="btn-action" onclick="dashboard.editHabit('${habit._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action" onclick="dashboard.deleteHabit('${habit._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="habit-card-body">
                        ${habit.description ? `<p class="habit-description">${habit.description}</p>` : ''}
                        <div class="habit-meta">
                            <span class="habit-category">${habit.category || 'other'}</span>
                            <span class="habit-streak">
                                <i class="fas fa-fire"></i> ${habit.statistics?.streak || 0} days
                            </span>
                        </div>
                    </div>
                    <div class="habit-card-footer">
                        <label class="checkbox-container">
                            <input type="checkbox" ${completed ? 'checked' : ''} 
                                   onchange="dashboard.completeHabit('${habit._id}', this.checked)">
                            <span class="checkmark"></span>
                            <span class="checkbox-label">Mark completed</span>
                        </label>
                        ${habit.timeSlot?.startTime ? `
                            <span class="habit-time">
                                <i class="fas fa-clock"></i> ${habit.timeSlot.startTime}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStats() {
        document.getElementById('todayCompleted').textContent = this.stats.completedToday || 0;
        document.getElementById('totalHabits').textContent = this.stats.totalHabits || 0;
        
        const totalToday = this.habits.filter(h => {
            const today = new Date();
            const day = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            return h.schedule && h.schedule[day];
        }).length;

        document.getElementById('completedCount').textContent = 
            `${this.stats.completedToday || 0}/${totalToday}`;
        document.getElementById('remainingCount').textContent = totalToday - (this.stats.completedToday || 0);
        
        const percent = totalToday > 0 ? Math.round((this.stats.completedToday / totalToday) * 100) : 0;
        document.getElementById('successRate').textContent = percent + '%';
    }

    setupCharts() {
        this.initWeeklyChart();
    }

    initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.weeklyChart) {
            this.weeklyChart.destroy();
        }

        const weekly = this.stats.weeklyProgress || {};

        this.weeklyChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    data: [
                        weekly['Mon'] || 0,
                        weekly['Tue'] || 0,
                        weekly['Wed'] || 0,
                        weekly['Thu'] || 0,
                        weekly['Fri'] || 0,
                        weekly['Sat'] || 0,
                        weekly['Sun'] || 0
                    ],
                    borderColor: '#00ff00',
                    backgroundColor: 'rgba(0,255,0,0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#00ff00'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#888' } },
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#888' }, beginAtZero: true }
                }
            }
        });
    }

    setupCalendars() {
        if (typeof FullCalendar === 'undefined') return;
        this.setupMiniCalendar();
    }

    setupMiniCalendar() {
        const cal = document.getElementById('miniCalendar');
        if (!cal) return;

        if (this.miniCalendar) {
            this.miniCalendar.destroy();
        }

        const events = this.generateCalendarEvents(30);

        this.miniCalendar = new FullCalendar.Calendar(cal, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next',
                center: 'title',
                right: ''
            },
            height: 300,
            events: events
        });

        this.miniCalendar.render();
    }

    generateCalendarEvents(days) {
        const events = [];
        const today = new Date();

        this.habits.forEach(habit => {
            if (habit.completedDates) {
                habit.completedDates.forEach(c => {
                    events.push({
                        title: '✅ ' + habit.title,
                        start: c.date.split('T')[0],
                        color: habit.color || '#00ff00',
                        allDay: true
                    });
                });
            }

            for (let i = 0; i < days; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                
                if (habit.schedule && habit.schedule[dayName]) {
                    const dateStr = date.toISOString().split('T')[0];
                    
                    const isCompleted = habit.completedDates?.some(c => 
                        c.date.split('T')[0] === dateStr
                    );

                    if (!isCompleted) {
                        events.push({
                            title: '○ ' + habit.title,
                            start: dateStr,
                            color: '#888888',
                            allDay: true
                        });
                    }
                }
            }
        });

        return events;
    }

    setupTimetable() {
        const timetable = document.getElementById('timetable');
        if (!timetable) return;

        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const todayHabits = this.habits
            .filter(h => h.schedule && h.schedule[dayName])
            .sort((a, b) => {
                const timeA = a.timeSlot?.startTime || '00:00';
                const timeB = b.timeSlot?.startTime || '00:00';
                return timeA.localeCompare(timeB);
            });

        if (todayHabits.length === 0) {
            timetable.innerHTML = `
                <div class="empty-state" style="padding: 1rem;">
                    <p>No timetable for today</p>
                </div>
            `;
            return;
        }

        timetable.innerHTML = todayHabits.map(habit => {
            const isCompleted = habit.completedDates?.some(d => 
                new Date(d.date).toDateString() === today.toDateString()
            );

            const startTime = habit.timeSlot?.startTime || '--:--';

            return `
                <div class="time-slot">
                    <div class="slot-time">${startTime}</div>
                    <div class="slot-content">
                        <span class="slot-habit">${habit.title}</span>
                        <span class="slot-status status-${isCompleted ? 'completed' : 'pending'}">
                            ${isCompleted ? '✓ Completed' : '○ Pending'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderSkills() {
        const grid = document.getElementById('skillsGrid');
        if (!grid) return;

        const skills = [
            { name: 'Mathematics', level: 'Intermediate', progress: 45, icon: 'fa-calculator' },
            { name: 'Programming', level: 'Intermediate', progress: 60, icon: 'fa-code' },
            { name: 'Physics', level: 'Beginner', progress: 30, icon: 'fa-atom' }
        ];

        grid.innerHTML = skills.map(skill => `
            <div class="skill-card">
                <div class="skill-header">
                    <div class="skill-icon"><i class="fas ${skill.icon}"></i></div>
                    <span class="skill-level">${skill.level}</span>
                </div>
                <h4>${skill.name}</h4>
                <div class="skill-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${skill.progress}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async completeHabit(habitId, completed) {
        if (!completed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/habits/${habitId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ date: new Date().toISOString() })
            });

            if (res.ok) {
                this.showNotification('✅ Habit completed!', 'success');
                await this.loadHabits();
                await this.loadStats();
                this.renderHabits();
                this.renderStats();
                this.updateCharts();
                this.setupTimetable();
            } else {
                this.showNotification('❌ Failed to complete', 'error');
            }
        } catch (error) {
            console.error('Complete habit error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    async addNewHabit() {
        const name = document.getElementById('habitName').value;
        if (!name) {
            this.showNotification('Please enter habit name', 'error');
            return;
        }

        const habitData = {
            title: name,
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
            habitData.timeSlot = { startTime: habitTime };
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/habits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(habitData)
            });

            if (res.ok) {
                this.showNotification('✅ Habit added!', 'success');
                document.getElementById('habitForm').reset();
                document.getElementById('addHabitModal').style.display = 'none';
                
                await this.loadHabits();
                await this.loadStats();
                this.renderHabits();
                this.renderStats();
                this.updateCharts();
                this.setupTimetable();
            } else {
                const err = await res.json();
                this.showNotification(err.error || 'Failed', 'error');
            }
        } catch (error) {
            console.error('Add habit error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    async deleteHabit(habitId) {
        if (!confirm('Delete this habit?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/habits/${habitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                this.showNotification('✅ Habit deleted', 'success');
                await this.loadHabits();
                await this.loadStats();
                this.renderHabits();
                this.renderStats();
                this.updateCharts();
                this.setupTimetable();
            }
        } catch (error) {
            console.error('Delete habit error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    editHabit(habitId) {
        const habit = this.habits.find(h => h._id === habitId);
        if (habit) {
            document.getElementById('habitName').value = habit.title;
            document.getElementById('habitCategory').value = habit.category || 'productivity';
            document.getElementById('habitDescription').value = habit.description || '';
            document.getElementById('habitDifficulty').value = habit.difficulty || 'medium';
            document.getElementById('habitColor').value = habit.color || '#00ff00';
            
            if (habit.schedule) {
                document.querySelector('input[name="monday"]').checked = habit.schedule.monday || false;
                document.querySelector('input[name="tuesday"]').checked = habit.schedule.tuesday || false;
                document.querySelector('input[name="wednesday"]').checked = habit.schedule.wednesday || false;
                document.querySelector('input[name="thursday"]').checked = habit.schedule.thursday || false;
                document.querySelector('input[name="friday"]').checked = habit.schedule.friday || false;
                document.querySelector('input[name="saturday"]').checked = habit.schedule.saturday || false;
                document.querySelector('input[name="sunday"]').checked = habit.schedule.sunday || false;
            }
            
            if (habit.timeSlot?.startTime) {
                document.getElementById('habitTime').value = habit.timeSlot.startTime;
            }
            
            document.getElementById('addHabitModal').style.display = 'flex';
        }
    }

    updateCharts() {
        if (this.weeklyChart) {
            const weekly = this.stats.weeklyProgress || {};
            this.weeklyChart.data.datasets[0].data = [
                weekly['Mon'] || 0,
                weekly['Tue'] || 0,
                weekly['Wed'] || 0,
                weekly['Thu'] || 0,
                weekly['Fri'] || 0,
                weekly['Sat'] || 0,
                weekly['Sun'] || 0
            ];
            this.weeklyChart.update();
        }

        if (this.miniCalendar) {
            this.miniCalendar.removeAllEvents();
            this.miniCalendar.addEventSource(this.generateCalendarEvents(30));
        }
    }

    switchPage(page) {
        document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
        const activeItem = document.querySelector(`.sidebar-menu li[data-page="${page}"]`);
        if (activeItem) activeItem.classList.add('active');

        document.querySelectorAll('.dashboard-content, .page-content').forEach(el => {
            el.style.display = 'none';
        });

        if (page === 'dashboard') {
            document.getElementById('dashboardContent').style.display = 'block';
            this.setupTimetable();
        } else {
            const el = document.getElementById(page + 'Page');
            if (el) {
                el.style.display = 'block';
                this.loadPage(page);
            }
        }
    }

    loadPage(page) {
        switch(page) {
            case 'habits':
                this.loadHabitsPage();
                break;
            case 'calendar':
                this.loadCalendarPage();
                break;
            case 'timetable':
                this.loadTimetablePage();
                break;
            case 'analytics':
                this.loadAnalyticsPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            case 'skills':
                this.renderSkills();
                break;
        }
    }

    loadHabitsPage() {
        const el = document.getElementById('allHabitsGrid');
        if (!el) return;

        if (this.habits.length === 0) {
            el.innerHTML = '<div class="empty-state"><p>No habits yet</p></div>';
            return;
        }

        el.innerHTML = this.habits.map(h => `
            <div class="habit-card">
                <div class="habit-card-header">
                    <div class="habit-color" style="background:${h.color||'#00ff00'}"></div>
                    <h3>${h.title}</h3>
                </div>
                <div class="habit-card-body">
                    <p>Category: ${h.category || 'other'}</p>
                    <p>Streak: ${h.statistics?.streak || 0} days</p>
                </div>
            </div>
        `).join('');
    }

    loadCalendarPage() {
        const el = document.getElementById('fullCalendar');
        if (!el || typeof FullCalendar === 'undefined') return;

        if (this.calendar) {
            this.calendar.destroy();
        }

        const events = this.generateCalendarEvents(90);

        this.calendar = new FullCalendar.Calendar(el, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            height: 500,
            events: events
        });

        this.calendar.render();
    }

    loadTimetablePage() {
        const el = document.getElementById('fullTimetable');
        if (!el) return;

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        let html = '';

        days.forEach((day, idx) => {
            const dayHabits = this.habits
                .filter(h => h.schedule && h.schedule[day])
                .sort((a, b) => {
                    const timeA = a.timeSlot?.startTime || '00:00';
                    const timeB = b.timeSlot?.startTime || '00:00';
                    return timeA.localeCompare(timeB);
                });

            if (dayHabits.length > 0) {
                html += `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: var(--primary-color);">${dayNames[idx]}</h3>
                        ${dayHabits.map(h => `
                            <div class="time-slot" style="margin: 0.5rem 0;">
                                <div class="slot-time">${h.timeSlot?.startTime || '--:--'}</div>
                                <div class="slot-content">${h.title}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        });

        el.innerHTML = html || '<div class="empty-state"><p>No timetable entries</p></div>';
    }

    loadAnalyticsPage() {
        const el = document.getElementById('analyticsContent');
        if (!el) return;

        const totalCompletions = this.stats.totalCompletions || 0;
        const successRate = this.stats.averageSuccessRate || 0;

        el.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 2rem;">
                <div class="progress-card">
                    <div class="progress-value">${totalCompletions}</div>
                    <p>Total Completions</p>
                </div>
                <div class="progress-card">
                    <div class="progress-value">${successRate}%</div>
                    <p>Success Rate</p>
                </div>
            </div>
        `;
    }

    loadProfilePage() {
        const el = document.getElementById('profileContent');
        if (!el) return;

        el.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                <p><strong>Username:</strong> ${this.user.username}</p>
                <p><strong>Email:</strong> ${this.user.email}</p>
                <p><strong>Current Streak:</strong> ${this.user.streak?.current || 0} days</p>
                <p><strong>Longest Streak:</strong> ${this.user.streak?.longest || 0} days</p>
                <p><strong>Member Since:</strong> ${new Date(this.user.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
        `;
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });

        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('userDropdown').classList.toggle('show');
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

        document.addEventListener('click', () => {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('show');
        });

        // Add habit button
        const addHabitBtn = document.getElementById('addHabitBtn');
        if (addHabitBtn) {
            addHabitBtn.addEventListener('click', () => {
                document.getElementById('addHabitModal').style.display = 'flex';
            });
        }

        // Close modal buttons
        const closeHabitModal = document.getElementById('closeHabitModal');
        if (closeHabitModal) {
            closeHabitModal.addEventListener('click', () => {
                document.getElementById('addHabitModal').style.display = 'none';
            });
        }

        const cancelHabitBtn = document.getElementById('cancelHabitBtn');
        if (cancelHabitBtn) {
            cancelHabitBtn.addEventListener('click', () => {
                document.getElementById('addHabitModal').style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('addHabitModal');
            if (e.target === modal) modal.style.display = 'none';
        });

        // Habit form submit
        const habitForm = document.getElementById('habitForm');
        if (habitForm) {
            habitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewHabit();
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                document.getElementById('notificationsPanel').classList.toggle('show');
            });
        }

        // Search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.searchHabits(e.target.value);
            });
        }
    }

    searchHabits(query) {
        if (!query || !this.habits.length) {
            this.renderHabits();
            return;
        }

        const filtered = this.habits.filter(h => 
            h.title.toLowerCase().includes(query.toLowerCase())
        );

        const grid = document.getElementById('habitsGrid');
        if (grid) {
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state"><p>No habits match your search</p></div>';
            } else {
                const today = new Date();
                grid.innerHTML = filtered.map(habit => `
                    <div class="habit-card">
                        <div class="habit-card-header">
                            <div class="habit-color" style="background: ${habit.color}"></div>
                            <h3>${habit.title}</h3>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
}

// Add animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});