class Charts {
    constructor() {
        this.progressChart = null;
        this.initialize();
    }
    
    initialize() {
        this.setupProgressChart();
    }
    
    setupProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;
        
        this.progressChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Habits Completed',
                    data: [],
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
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888888'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888888'
                        }
                    }
                }
            }
        });
    }
    
    updateProgressChart(stats) {
        if (!this.progressChart || !stats.weeklyProgress) return;
        
        const days = Object.keys(stats.weeklyProgress);
        const completions = Object.values(stats.weeklyProgress);
        
        this.progressChart.data.labels = days;
        this.progressChart.data.datasets[0].data = completions;
        this.progressChart.update();
    }
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.charts = new Charts();
    window.updateProgressChart = (stats) => {
        window.charts.updateProgressChart(stats);
    };
});