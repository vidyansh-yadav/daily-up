class PomodoroTimer {
    constructor() {
        this.workDuration = 25 * 60; // 25 minutes in seconds
        this.shortBreak = 5 * 60; // 5 minutes
        this.longBreak = 15 * 60; // 15 minutes
        this.sessionsBeforeLongBreak = 4;
        
        this.currentMode = 'work'; // work, shortBreak, longBreak
        this.timeLeft = this.workDuration;
        this.isRunning = false;
        this.sessionsCompleted = 0;
        this.timer = null;
        
        this.apiUrl = window.location.origin + '/api';
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    async loadSettings() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/pomodoro/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                this.workDuration = data.workDuration * 60;
                this.shortBreak = data.shortBreak * 60;
                this.longBreak = data.longBreak * 60;
                this.sessionsBeforeLongBreak = data.sessionsBeforeLongBreak;
                this.timeLeft = this.workDuration;
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    setupEventListeners() {
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');
        const resetBtn = document.getElementById('timerReset');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        
        // Mode buttons
        document.querySelectorAll('.timer-setting').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            });
        });
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
        
        this.updateButtonStates();
    }
    
    pause() {
        this.isRunning = false;
        clearInterval(this.timer);
        this.updateButtonStates();
    }
    
    reset() {
        this.pause();
        this.timeLeft = this.currentMode === 'work' ? this.workDuration :
                       this.currentMode === 'shortBreak' ? this.shortBreak :
                       this.longBreak;
        this.updateDisplay();
    }
    
    async complete() {
        this.pause();
        
        // Play sound
        const audio = new Audio('/sounds/complete.mp3');
        audio.play();
        
        // Show notification
        if (Notification.permission === 'granted') {
            new Notification('Pomodoro Complete!', {
                body: this.currentMode === 'work' ? 'Time for a break!' : 'Back to work!',
                icon: '/icons/icon-192x192.png'
            });
        }
        
        // Save session
        if (this.currentMode === 'work') {
            this.sessionsCompleted++;
            await this.saveSession();
        }
        
        // Auto-switch mode
        if (this.currentMode === 'work') {
            if (this.sessionsCompleted % this.sessionsBeforeLongBreak === 0) {
                this.switchMode('longBreak');
            } else {
                this.switchMode('shortBreak');
            }
        } else {
            this.switchMode('work');
        }
    }
    
    async saveSession() {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${this.apiUrl}/pomodoro/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    duration: this.currentMode === 'work' ? this.workDuration / 60 : 0,
                    completed: true,
                    focusLevel: document.getElementById('focusLevel')?.value || 7
                })
            });
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        this.reset();
        
        // Update UI
        document.querySelectorAll('.timer-setting').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update timer color
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.style.color = mode === 'work' ? '#00ff00' :
                                      mode === 'shortBreak' ? '#00ccff' : '#ffaa00';
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        const display = document.getElementById('timerDisplay');
        if (display) {
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update document title
        document.title = `(${display?.textContent}) Daily-Up Pomodoro`;
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');
        
        if (startBtn) startBtn.disabled = this.isRunning;
        if (pauseBtn) pauseBtn.disabled = !this.isRunning;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoro = new PomodoroTimer();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});