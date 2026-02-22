class HabitCalendar {
    constructor() {
        this.calendar = null;
        this.habits = [];
        this.initialize();
    }
    
    async initialize() {
        await this.loadHabits();
        this.setupCalendar();
    }
    
    async loadHabits() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/habits', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.habits = await response.json();
            }
        } catch (error) {
            console.error('Error loading habits for calendar:', error);
        }
    }
    
    setupCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            themeSystem: 'bootstrap5',
            events: this.getCalendarEvents(),
            eventColor: '#00ff00',
            eventTextColor: '#000000',
            eventDisplay: 'block',
            height: 'auto',
            dayMaxEvents: true,
            eventClick: (info) => {
                this.showEventDetails(info.event);
            }
        });
        
        this.calendar.render();
    }
    
    getCalendarEvents() {
        const events = [];
        
        this.habits.forEach(habit => {
            // Add completion dates as events
            if (habit.completedDates && habit.completedDates.length > 0) {
                habit.completedDates.forEach(completion => {
                    events.push({
                        title: habit.title,
                        start: completion.date,
                        color: habit.color || '#00ff00',
                        extendedProps: {
                            habitId: habit._id,
                            notes: completion.notes,
                            timeSpent: completion.timeSpent
                        }
                    });
                });
            }
            
            // Add upcoming scheduled dates
            const schedule = habit.schedule || {};
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                if (schedule[dayName]) {
                    events.push({
                        title: `Scheduled: ${habit.title}`,
                        start: new Date(date),
                        color: '#555555',
                        display: 'background',
                        extendedProps: {
                            habitId: habit._id,
                            isScheduled: true
                        }
                    });
                }
            }
        });
        
        return events;
    }
    
    showEventDetails(event) {
        const habit = this.habits.find(h => h._id === event.extendedProps.habitId);
        if (!habit) return;
        
        let details = `
            <strong>${event.title}</strong><br>
            Date: ${event.start.toLocaleDateString()}<br>
        `;
        
        if (event.extendedProps.notes) {
            details += `Notes: ${event.extendedProps.notes}<br>`;
        }
        
        if (event.extendedProps.timeSpent) {
            details += `Time spent: ${event.extendedProps.timeSpent} minutes<br>`;
        }
        
        alert(details);
    }
    
    refresh() {
        if (this.calendar) {
            this.calendar.refetchEvents();
        }
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.habitCalendar = new HabitCalendar();
});