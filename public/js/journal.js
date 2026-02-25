class JournalSystem {
    constructor() {
        this.entries = [];
        this.currentDate = new Date();
        this.apiUrl = window.location.origin + '/api';
        
        this.init();
    }
    
    async init() {
        await this.loadEntries();
        this.setupEventListeners();
        this.renderCalendar();
    }
    
    async loadEntries() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/journal?month=${this.currentDate.getMonth()}&year=${this.currentDate.getFullYear()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.entries = await res.json();
            }
        } catch (error) {
            console.error('Failed to load journal:', error);
        }
    }
    
    setupEventListeners() {
        const moodBtns = document.querySelectorAll('.mood-btn');
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                moodBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('selectedMood').value = btn.dataset.value;
            });
        });
        
        const addGratitudeBtn = document.getElementById('addGratitude');
        if (addGratitudeBtn) {
            addGratitudeBtn.addEventListener('click', () => this.addGratitude());
        }
        
        const saveBtn = document.getElementById('saveJournal');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveEntry());
        }
    }
    
    addGratitude() {
        const list = document.getElementById('gratitudeList');
        const item = document.createElement('div');
        item.className = 'gratitude-item';
        item.innerHTML = `
            <input type="text" class="gratitude-input" placeholder="I'm grateful for...">
            <button class="btn-action" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(item);
    }
    
    async saveEntry() {
        const entry = {
            date: this.currentDate,
            mood: parseInt(document.getElementById('selectedMood').value) || 5,
            energy: parseInt(document.getElementById('energyLevel').value) || 5,
            stress: parseInt(document.getElementById('stressLevel').value) || 5,
            notes: document.getElementById('journalNotes').value,
            gratitude: Array.from(document.querySelectorAll('.gratitude-input')).map(i => i.value).filter(v => v),
            reflections: {
                wins: document.getElementById('reflectionWins')?.value,
                challenges: document.getElementById('reflectionChallenges')?.value,
                learnings: document.getElementById('reflectionLearnings')?.value,
                tomorrow: document.getElementById('reflectionTomorrow')?.value
            }
        };
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/journal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(entry)
            });
            
            if (res.ok) {
                this.showNotification('Journal entry saved!', 'success');
                await this.loadEntries();
                this.renderCalendar();
            }
        } catch (error) {
            console.error('Failed to save journal:', error);
            this.showNotification('Error saving entry', 'error');
        }
    }
    
    renderCalendar() {
        const calendar = document.getElementById('journalCalendar');
        if (!calendar) return;
        
        const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();
        
        let html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">';
        
        // Day names
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            html += `<div style="text-align: center; font-weight: bold; color: var(--primary-color);">${day}</div>`;
        });
        
        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }
        
        // Calendar days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dateStr = date.toDateString();
            
            const entry = this.entries.find(e => new Date(e.date).toDateString() === dateStr);
            
            html += `
                <div class="calendar-day ${entry ? 'has-entry' : ''}" 
                     onclick="journal.loadEntry('${dateStr}')"
                     style="
                        aspect-ratio: 1;
                        background: ${entry ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,255,0.02)'};
                        border: 1px solid ${entry ? 'var(--primary-color)' : 'var(--border-color)'};
                        border-radius: 4px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                     ">
                    <div>${day}</div>
                    ${entry ? `<div style="font-size: 0.8rem;">😊 ${entry.mood}</div>` : ''}
                </div>
            `;
        }
        
        html += '</div>';
        calendar.innerHTML = html;
    }
    
    async loadEntry(dateStr) {
        const entry = this.entries.find(e => new Date(e.date).toDateString() === dateStr);
        
        if (entry) {
            // Fill form with entry data
            document.getElementById('journalNotes').value = entry.notes || '';
            document.getElementById('energyLevel').value = entry.energy || 5;
            document.getElementById('stressLevel').value = entry.stress || 5;
            
            // Set mood
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.classList.toggle('selected', parseInt(btn.dataset.value) === entry.mood);
            });
            
            // Set gratitude
            const list = document.getElementById('gratitudeList');
            list.innerHTML = '';
            if (entry.gratitude) {
                entry.gratitude.forEach(g => {
                    const item = document.createElement('div');
                    item.className = 'gratitude-item';
                    item.innerHTML = `
                        <input type="text" class="gratitude-input" value="${g}">
                        <button class="btn-action" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    list.appendChild(item);
                });
            }
            
            this.showNotification('Entry loaded', 'info');
        } else {
            // Clear form for new entry
            document.getElementById('journalNotes').value = '';
            document.getElementById('energyLevel').value = 5;
            document.getElementById('stressLevel').value = 5;
            document.getElementById('gratitudeList').innerHTML = '';
            document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
            
            this.currentDate = new Date(dateStr);
        }
    }
    
    showNotification(msg, type) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${type === 'success' ? '#00ff00' : type === 'error' ? '#ff3333' : '#00ccff'};
            color: #000; padding: 12px 20px; border-radius: 4px;
            font-family: 'Courier New', monospace;
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = msg;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.journal = new JournalSystem();
});