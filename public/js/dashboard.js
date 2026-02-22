// ==========================================
// DASHBOARD.JS - COMPLETE FIX
// Developed by: UNSEEN-TERMINATION
// ==========================================

class Dashboard {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('user')) || null;
        this.habits = [];
        this.stats = {
            completedToday: 0,
            totalHabits: 0,
            averageSuccessRate: 85,
            weeklyProgress: {
                'Mon': 3, 'Tue': 5, 'Wed': 4, 'Thu': 6, 'Fri': 5, 'Sat': 4, 'Sun': 2
            }
        };
        this.initialize();
    }
    
    async initialize() {
        // Check if user is logged in
        if (!this.user) {
            // For demo purposes, create a dummy user
            this.user = {
                username: 'Developer',
                email: 'dev@daily-up.com',
                streak: { current: 7 }
            };
        }
        
        this.setupEventListeners();
        this.updateUserProfile();
        this.loadDummyHabits();
        this.loadStatistics();
        this.setupCharts();
        this.setupCalendar();
        this.setupTimetable();
        
        // Hide loading screen after 2 seconds
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) loadingScreen.style.display = 'none';
        }, 1500);
        
        // Show motivation popup after 3 seconds
        setTimeout(() => {
            this.showMotivationPopup();
        }, 3000);
    }
    
    setupEventListeners() {
        // Sidebar menu click
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });
        
        // User menu dropdown
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('userDropdown');
                dropdown.classList.toggle('show');
            });
        }
        
        // Close dropdown when clicking outside
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
        
        const addFirstHabitBtn = document.getElementById('addFirstHabitBtn');
        if (addFirstHabitBtn) {
            addFirstHabitBtn.addEventListener('click', () => {
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
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('addHabitModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Habit form submit
        const habitForm = document.getElementById('habitForm');
        if (habitForm) {
            habitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewHabit();
            });
        }
        
        // Color presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', function() {
                const color = this.dataset.color;
                document.getElementById('habitColor').value = color;
            });
        });
        
        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                document.getElementById('notificationsPanel').classList.toggle('show');
            });
        }
        
        // Close popup buttons
        const closePopup = document.getElementById('closePopup');
        if (closePopup) {
            closePopup.addEventListener('click', () => {
                document.getElementById('motivationPopup').style.display = 'none';
            });
        }
        
        const dismissPopup = document.getElementById('dismissPopup');
        if (dismissPopup) {
            dismissPopup.addEventListener('click', () => {
                document.getElementById('motivationPopup').style.display = 'none';
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
            });
        }
        
        // Chart range selector
        const chartRange = document.getElementById('chartRange');
        if (chartRange) {
            chartRange.addEventListener('change', () => {
                this.updateChart();
            });
        }
        
        // Edit timetable button
        const editTimetableBtn = document.getElementById('editTimetableBtn');
        if (editTimetableBtn) {
            editTimetableBtn.addEventListener('click', () => {
                this.showNotification('Timetable editing coming soon!', 'info');
            });
        }
        
        // Add skill button
        const addSkillBtn = document.getElementById('addSkillBtn');
        if (addSkillBtn) {
            addSkillBtn.addEventListener('click', () => {
                this.showNotification('Add skill feature coming soon!', 'info');
            });
        }
    }
    
    switchPage(page) {
        // Update active menu item
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.sidebar-menu li[data-page="${page}"]`).classList.add('active');
        
        // Show different content based on page
        const dashboardContent = document.getElementById('dashboardContent');
        const habitsPage = document.getElementById('habitsPage');
        const calendarPage = document.getElementById('calendarPage');
        
        if (dashboardContent) dashboardContent.style.display = 'none';
        if (habitsPage) habitsPage.style.display = 'none';
        if (calendarPage) calendarPage.style.display = 'none';
        
        if (page === 'dashboard') {
            if (dashboardContent) dashboardContent.style.display = 'block';
        } else if (page === 'habits') {
            if (habitsPage) {
                habitsPage.style.display = 'block';
                habitsPage.innerHTML = '<h2>All Habits</h2><p>Habits management page coming soon...</p>';
            }
        } else if (page === 'calendar') {
            if (calendarPage) {
                calendarPage.style.display = 'block';
                calendarPage.innerHTML = '<h2>Calendar View</h2><p>Calendar page coming soon...</p>';
            }
        } else {
            this.showNotification(`${page} page coming soon!`, 'info');
            if (dashboardContent) dashboardContent.style.display = 'block';
            document.querySelector(`.sidebar-menu li[data-page="dashboard"]`).classList.add('active');
        }
    }
    
    updateUserProfile() {
        if (this.user) {
            const usernameEl = document.getElementById('username');
            const userEmailEl = document.getElementById('userEmail');
            const streakCountEl = document.getElementById('streakCount');
            const welcomeMessageEl = document.getElementById('welcomeMessage');
            
            if (usernameEl) usernameEl.textContent = this.user.username || 'Developer';
            if (userEmailEl) userEmailEl.textContent = this.user.email || 'dev@daily-up.com';
            if (streakCountEl) streakCountEl.textContent = `${this.user.streak?.current || 7} day streak`;
            if (welcomeMessageEl) welcomeMessageEl.textContent = `Welcome back, ${this.user.username || 'Developer'}!`;
        }
        
        // Set current date
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            const now = new Date();
            currentDateEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Set greeting based on time
        const greetingEl = document.getElementById('greetingText');
        if (greetingEl) {
            const hour = new Date().getHours();
            if (hour < 12) greetingEl.textContent = 'Good Morning';
            else if (hour < 18) greetingEl.textContent = 'Good Afternoon';
            else greetingEl.textContent = 'Good Evening';
        }
    }
    
    loadDummyHabits() {
        this.habits = [
            {
                _id: '1',
                title: 'Morning Code Practice',
                description: '30 minutes of coding practice',
                category: 'coding',
                difficulty: 'medium',
                color: '#00ff00',
                schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false },
                timeSlot: { hour: 8, minute: 0, period: 'AM' },
                statistics: { streak: 7 },
                completedDates: []
            },
            {
                _id: '2',
                title: 'Daily Exercise',
                description: '30 minutes workout',
                category: 'fitness',
                difficulty: 'easy',
                color: '#00ccff',
                schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
                timeSlot: { hour: 18, minute: 0, period: 'PM' },
                statistics: { streak: 12 },
                completedDates: []
            },
            {
                _id: '3',
                title: 'Read Technical Book',
                description: '20 pages of technical book',
                category: 'learning',
                difficulty: 'hard',
                color: '#ff00ff',
                schedule: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: true },
                timeSlot: { hour: 21, minute: 0, period: 'PM' },
                statistics: { streak: 3 },
                completedDates: []
            }
        ];
        
        this.renderHabits();
    }
    
    renderHabits() {
        const habitsGrid = document.getElementById('habitsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!habitsGrid) return;
        
        if (this.habits.length === 0) {
            habitsGrid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
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
                    <p>Check back tomorrow or edit your schedule</p>
                </div>
            `;
            return;
        }
        
        // Update stats
        document.getElementById('todayCompleted').textContent = '3';
        document.getElementById('totalHabits').textContent = this.habits.length;
        document.getElementById('completedCount').textContent = '3/' + todayHabits.length;
        document.getElementById('remainingCount').textContent = todayHabits.length - 3;
        document.getElementById('progressPercent').textContent = Math.round((3 / todayHabits.length) * 100) + '%';
        
        // Set progress ring
        const progressRing = document.querySelector('.progress-ring-circle');
        if (progressRing) {
            const percent = (3 / todayHabits.length) * 100;
            const dashOffset = 339.292 * (1 - percent / 100);
            progressRing.style.strokeDashoffset = dashOffset;
        }
        
        // Render habits
        habitsGrid.innerHTML = todayHabits.map(habit => {
            const isCompleted = Math.random() > 0.5; // Random for demo
            
            return `
                <div class="habit-card ${isCompleted ? 'completed' : ''}" data-id="${habit._id}">
                    <div class="habit-card-header">
                        <div class="habit-color" style="background: ${habit.color || '#00ff00'}"></div>
                        <h3>${habit.title}</h3>
                        <div class="habit-actions">
                            <button class="btn-action edit-habit" title="Edit" onclick="dashboard.editHabit('${habit._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete-habit" title="Delete" onclick="dashboard.deleteHabit('${habit._id}')">
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
                            <span class="checkbox-label">Mark as completed</span>
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
    
    formatTime(timeSlot) {
        if (!timeSlot) return '';
        let hour = timeSlot.hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        const minute = timeSlot.minute?.toString().padStart(2, '0') || '00';
        return `${hour}:${minute} ${period}`;
    }
    
    toggleHabitCompletion(habitId, completed) {
        if (completed) {
            this.showNotification('Habit marked as completed!', 'success');
            this.renderHabits();
            this.loadStatistics();
        }
    }
    
    editHabit(habitId) {
        const habit = this.habits.find(h => h._id === habitId);
        if (habit) {
            document.getElementById('habitName').value = habit.title;
            document.getElementById('habitCategory').value = habit.category;
            document.getElementById('habitDescription').value = habit.description || '';
            document.getElementById('habitDifficulty').value = habit.difficulty;
            document.getElementById('habitColor').value = habit.color || '#00ff00';
            
            if (habit.timeSlot) {
                const hour = habit.timeSlot.hour.toString().padStart(2, '0');
                const minute = (habit.timeSlot.minute || '00').toString().padStart(2, '0');
                document.getElementById('habitTime').value = `${hour}:${minute}`;
            }
            
            document.getElementById('addHabitModal').style.display = 'flex';
            this.showNotification('Edit mode activated', 'info');
        }
    }
    
    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(h => h._id !== habitId);
            this.renderHabits();
            this.showNotification('Habit deleted successfully', 'success');
        }
    }
    
    addNewHabit() {
        const habitName = document.getElementById('habitName').value;
        if (!habitName) {
            this.showNotification('Please enter a habit name', 'error');
            return;
        }
        
        const newHabit = {
            _id: Date.now().toString(),
            title: habitName,
            category: document.getElementById('habitCategory').value,
            description: document.getElementById('habitDescription').value,
            difficulty: document.getElementById('habitDifficulty').value,
            color: document.getElementById('habitColor').value,
            schedule: {
                monday: document.querySelector('input[name="monday"]')?.checked || true,
                tuesday: document.querySelector('input[name="tuesday"]')?.checked || true,
                wednesday: document.querySelector('input[name="wednesday"]')?.checked || true,
                thursday: document.querySelector('input[name="thursday"]')?.checked || true,
                friday: document.querySelector('input[name="friday"]')?.checked || true,
                saturday: document.querySelector('input[name="saturday"]')?.checked || true,
                sunday: document.querySelector('input[name="sunday"]')?.checked || true
            },
            statistics: { streak: 0 }
        };
        
        const habitTime = document.getElementById('habitTime').value;
        if (habitTime) {
            const [hour, minute] = habitTime.split(':');
            newHabit.timeSlot = {
                hour: parseInt(hour),
                minute: parseInt(minute),
                period: parseInt(hour) >= 12 ? 'PM' : 'AM'
            };
        }
        
        this.habits.push(newHabit);
        this.renderHabits();
        document.getElementById('habitForm').reset();
        document.getElementById('addHabitModal').style.display = 'none';
        this.showNotification('Habit added successfully!', 'success');
    }
    
    loadStatistics() {
        // Update stats
        document.getElementById('streakCount').textContent = '7 day streak';
        document.getElementById('todayCompleted').textContent = '3';
        document.getElementById('totalHabits').textContent = this.habits.length;
        document.getElementById('monthCompletion').textContent = '75%';
        document.getElementById('rankPosition').textContent = '#1';
        
        // Update weekly streak calendar
        this.renderStreakCalendar();
        
        // Update categories
        this.renderCategories();
        
        // Update skills
        this.renderSkills();
    }
    
    renderStreakCalendar() {
        const streakCalendar = document.getElementById('streakCalendar');
        if (!streakCalendar) return;
        
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        let html = '';
        
        for (let i = 0; i < 7; i++) {
            const isActive = i < 5; // First 5 days active for demo
            html += `<div class="streak-day ${isActive ? 'active' : ''}">${days[i]}</div>`;
        }
        
        streakCalendar.innerHTML = html;
    }
    
    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;
        
        const categories = {
            'Coding': 8,
            'Fitness': 5,
            'Learning': 4,
            'Productivity': 6
        };
        
        let html = '';
        for (const [category, count] of Object.entries(categories)) {
            html += `
                <div class="category-item">
                    <span class="category-name">
                        <i class="fas fa-tag" style="color: var(--primary-color);"></i>
                        ${category}
                    </span>
                    <span class="category-count">${count}</span>
                </div>
            `;
        }
        
        categoriesList.innerHTML = html;
    }
    
    renderSkills() {
        const skillsGrid = document.getElementById('skillsGrid');
        if (!skillsGrid) return;
        
        const skills = [
            { name: 'JavaScript', level: 'Intermediate', progress: 65, icon: 'fab fa-js' },
            { name: 'React', level: 'Beginner', progress: 35, icon: 'fab fa-react' },
            { name: 'Node.js', level: 'Intermediate', progress: 55, icon: 'fab fa-node' },
            { name: 'Python', level: 'Beginner', progress: 25, icon: 'fab fa-python' }
        ];
        
        let html = '';
        skills.forEach(skill => {
            html += `
                <div class="skill-card">
                    <div class="skill-header">
                        <div class="skill-icon">
                            <i class="${skill.icon}"></i>
                        </div>
                        <span class="skill-level">${skill.level}</span>
                    </div>
                    <h4>${skill.name}</h4>
                    <div class="skill-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${skill.progress}%;"></div>
                        </div>
                    </div>
                    <div class="skill-stats">
                        <span>Progress</span>
                        <span>${skill.progress}%</span>
                    </div>
                </div>
            `;
        });
        
        skillsGrid.innerHTML = html;
    }
    
    setupCharts() {
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initWeeklyChart();
        }
    }
    
    initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;
        
        // Check if chart already exists and destroy it
        if (window.weeklyChart) {
            window.weeklyChart.destroy();
        }
        
        window.weeklyChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Habits Completed',
                    data: [3, 5, 4, 6, 5, 4, 2],
                    borderColor: '#00ff00',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00ff00',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleColor: '#00ff00',
                        bodyColor: '#fff',
                        borderColor: '#00ff00',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#888'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#888',
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    updateChart() {
        if (window.weeklyChart) {
            // Random data for demo
            const newData = [3, 5, 4, 6, 5, 4, 2].map(() => Math.floor(Math.random() * 8) + 1);
            window.weeklyChart.data.datasets[0].data = newData;
            window.weeklyChart.update();
        }
    }
    
    setupCalendar() {
        // Initialize calendar if FullCalendar is available
        if (typeof FullCalendar !== 'undefined') {
            const calendarEl = document.getElementById('calendar');
            if (calendarEl) {
                const calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    headerToolbar: {
                        left: 'prev,next',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    },
                    themeSystem: 'standard',
                    height: 350,
                    events: [
                        { title: 'Code Practice', start: '2024-01-15', color: '#00ff00' },
                        { title: 'Exercise', start: '2024-01-16', color: '#00ccff' },
                        { title: 'Reading', start: '2024-01-17', color: '#ff00ff' }
                    ]
                });
                calendar.render();
            }
        }
        
        // Set current month
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) {
            const now = new Date();
            currentMonthEl.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    }
    
    setupTimetable() {
        const timetable = document.getElementById('timetable');
        if (!timetable) return;
        
        const timeSlots = [
            { time: '08:00 AM', habit: 'Morning Code Practice', status: 'completed' },
            { time: '10:00 AM', habit: 'Team Meeting', status: 'pending' },
            { time: '12:00 PM', habit: 'Lunch Break', status: 'pending' },
            { time: '02:00 PM', habit: 'Project Work', status: 'pending' },
            { time: '04:00 PM', habit: 'Learning Session', status: 'pending' },
            { time: '06:00 PM', habit: 'Exercise', status: 'pending' }
        ];
        
        let html = '';
        timeSlots.forEach(slot => {
            html += `
                <div class="time-slot">
                    <div class="slot-time">${slot.time}</div>
                    <div class="slot-content">
                        <span class="slot-habit">${slot.habit}</span>
                        <span class="slot-status status-${slot.status}">${slot.status}</span>
                    </div>
                    <button class="slot-action">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            `;
        });
        
        timetable.innerHTML = html;
    }
    
    showMotivationPopup() {
        const popup = document.getElementById('motivationPopup');
        if (!popup) return;
        
        const motivations = [
            "Consistency is the key to mastery. Keep coding daily!",
            "Every line of code you write brings you closer to your goals.",
            "Great developers are made, not born. Keep practicing!",
            "Your progress may be slow, but it's still progress.",
            "The best time to start was yesterday. The second best is now.",
            "Every bug you fix makes you a better problem solver.",
            "Don't watch the clock; do what it does. Keep going!",
            "Learning to code is learning to create and innovate.",
            "Your dedication to daily habits is building a better you.",
            "Stay focused on your goals. You've got this!"
        ];
        
        const quotes = [
            "The secret of getting ahead is getting started.",
            "Code is like humor. When you have to explain it, it's bad.",
            "First, solve the problem. Then, write the code.",
            "Experience is the name everyone gives to their mistakes.",
            "Any fool can write code that a computer can understand."
        ];
        
        const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        document.getElementById('motivationText').textContent = randomMotivation;
        document.getElementById('quoteText').textContent = randomQuote;
        
        popup.style.display = 'block';
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            popup.style.display = 'none';
        }, 10000);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 255, 0, 0.9)' : type === 'error' ? 'rgba(255, 51, 51, 0.9)' : 'rgba(0, 204, 255, 0.9)'};
            color: ${type === 'success' ? '#000' : '#fff'};
            padding: 12px 20px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${type === 'success' ? '#00ff00' : type === 'error' ? '#ff3333' : '#00ccff'};
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .notification-success {
        background: rgba(0, 255, 0, 0.9);
        color: #000;
    }
    
    .notification-error {
        background: rgba(255, 51, 51, 0.9);
        color: #fff;
    }
    
    .notification-info {
        background: rgba(0, 204, 255, 0.9);
        color: #000;
    }
    
    .user-dropdown.show {
        display: block;
    }
    
    .notifications-panel.show {
        display: block;
    }
`;
document.head.appendChild(style);