// ==========================================
// COMPLETE DASHBOARD - FULLY WORKING
// With Skills Focus, Profile Picture Upload
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
        this.gamification = null;
        this.skills = [];
        this.apiUrl = window.location.origin + '/api';
        this.weeklyChart = null;
        this.calendar = null;
        this.miniCalendar = null;
        this.audioEnabled = true;
        this.currentMusic = null;
        
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
            
            // Load all data
            await this.loadHabits();
            await this.loadStats();
            await this.loadGamification();
            await this.loadSkills();
            
            // Update UI
            this.updateUserProfile();
            this.renderGamification();
            this.renderHabits();
            this.renderStats();
            this.setupCharts();
            this.setupCalendars();
            this.setupTimetable();
            this.renderSkills();
            this.setupEventListeners();
            this.addWatermark();
            this.setupMusicSystem();
            this.setupProfilePictureUpload();
            
            this.hideLoading();
            
            console.log('✅ Dashboard ready');
        } catch (error) {
            console.error('Dashboard error:', error);
            this.hideLoading();
            this.showError('Failed to load dashboard');
            
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

    // ========== PROFILE PICTURE UPLOAD ==========
    setupProfilePictureUpload() {
        const avatar = document.getElementById('userAvatar');
        if (!avatar) return;
        
        // Create upload button
        const uploadBtn = document.createElement('div');
        uploadBtn.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            background: var(--primary-color);
            color: var(--dark-bg);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 2px solid var(--dark-bg);
            font-size: 0.9rem;
            transition: all 0.3s;
        `;
        uploadBtn.innerHTML = '<i class="fas fa-camera"></i>';
        uploadBtn.title = 'Change profile picture';
        
        // Make avatar container relative
        avatar.style.position = 'relative';
        avatar.appendChild(uploadBtn);
        
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadProfilePicture(file);
            }
        });
        
        // Load saved profile picture
        this.loadProfilePicture();
    }
    
    uploadProfilePicture(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Save to localStorage
            localStorage.setItem('profilePicture', imageData);
            
            // Update avatar
            this.updateAvatar(imageData);
            
            this.showNotification('✅ Profile picture updated!', 'success');
        };
        reader.readAsDataURL(file);
    }
    
    loadProfilePicture() {
        const savedPicture = localStorage.getItem('profilePicture');
        if (savedPicture) {
            this.updateAvatar(savedPicture);
        }
    }
    
    updateAvatar(imageData) {
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.innerHTML = `<img src="${imageData}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
        
        // Also update profile page avatar if exists
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.innerHTML = `<img src="${imageData}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    }

    // ========== SKILLS SYSTEM ==========
    async loadSkills() {
        try {
            // Load from localStorage first
            const savedSkills = localStorage.getItem('dailyup_skills');
            if (savedSkills) {
                this.skills = JSON.parse(savedSkills);
            } else {
                // Default skills
                this.skills = [
                    // Coding Skills
                    {
                        category: '💻 Coding',
                        items: [
                            { name: 'JavaScript', level: 'Intermediate', progress: 65, icon: 'fab fa-js', color: '#f7df1e', completed: 45, hours: 120 },
                            { name: 'Python', level: 'Beginner', progress: 30, icon: 'fab fa-python', color: '#3776ab', completed: 21, hours: 45 },
                            { name: 'React', level: 'Intermediate', progress: 55, icon: 'fab fa-react', color: '#61dafb', completed: 38, hours: 85 }
                        ]
                    },
                    // Academic Skills
                    {
                        category: '📚 Academics',
                        items: [
                            { name: 'Mathematics', level: 'Advanced', progress: 85, icon: 'fas fa-calculator', color: '#00ff00', completed: 60, hours: 200 },
                            { name: 'Physics', level: 'Intermediate', progress: 60, icon: 'fas fa-atom', color: '#00ccff', completed: 42, hours: 120 },
                            { name: 'Chemistry', level: 'Beginner', progress: 35, icon: 'fas fa-flask', color: '#ffaa00', completed: 25, hours: 60 }
                        ]
                    },
                    // Soft Skills
                    {
                        category: '🤝 Soft Skills',
                        items: [
                            { name: 'Communication', level: 'Intermediate', progress: 70, icon: 'fas fa-comments', color: '#00ff00', completed: 49, hours: 90 },
                            { name: 'Leadership', level: 'Beginner', progress: 40, icon: 'fas fa-users', color: '#00ccff', completed: 28, hours: 50 }
                        ]
                    },
                    // Fitness
                    {
                        category: '💪 Fitness',
                        items: [
                            { name: 'Gym', level: 'Intermediate', progress: 75, icon: 'fas fa-dumbbell', color: '#ffaa00', completed: 52, hours: 150 },
                            { name: 'Yoga', level: 'Beginner', progress: 25, icon: 'fas fa-pray', color: '#00ff00', completed: 18, hours: 30 }
                        ]
                    }
                ];
                localStorage.setItem('dailyup_skills', JSON.stringify(this.skills));
            }
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    }

    renderSkills() {
        const grid = document.getElementById('skillsGrid');
        if (!grid) {
            console.log('Skills grid not found!');
            return;
        }

        // Clear loading state
        grid.innerHTML = '';

        if (!this.skills || this.skills.length === 0) {
            grid.innerHTML = `
                <div class="empty-skills">
                    <i class="fas fa-brain"></i>
                    <h3>No skills yet</h3>
                    <p>Start tracking your skills by adding your first skill!</p>
                    <button class="btn-primary" onclick="dashboard.showAddSkillModal()">
                        <i class="fas fa-plus"></i> Add Your First Skill
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        
        this.skills.forEach(category => {
            // Category header
            html += `
                <div class="category-header">
                    <h3>${category.category}</h3>
                </div>
            `;
            
            // Skills in this category
            category.items.forEach(skill => {
                // Calculate progress from habits
                const habitProgress = this.calculateSkillProgress(skill.name);
                const finalProgress = habitProgress > 0 ? habitProgress : skill.progress;
                
                html += `
                    <div class="skill-card" data-skill="${skill.name}">
                        <div class="skill-header">
                            <div class="skill-icon" style="background: ${skill.color}20; color: ${skill.color};">
                                <i class="${skill.icon}"></i>
                            </div>
                            <span class="skill-level" style="background: ${skill.color}; color: #000;">
                                ${skill.level}
                            </span>
                        </div>
                        <h4>${skill.name}</h4>
                        <div class="skill-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${finalProgress}%; background: ${skill.color};"></div>
                            </div>
                            <div class="skill-stats">
                                <span><i class="fas fa-check-circle"></i> ${skill.completed || 0} tasks</span>
                                <span><i class="fas fa-clock"></i> ${skill.hours || 0}h</span>
                            </div>
                        </div>
                        <div class="skill-actions">
                            <button class="btn-small" onclick="dashboard.logSkill('${skill.name}')">
                                <i class="fas fa-plus"></i> Log
                            </button>
                            <button class="btn-small" onclick="dashboard.viewSkillDetails('${skill.name}')">
                                <i class="fas fa-chart-line"></i> Details
                            </button>
                        </div>
                    </div>
                `;
            });
        });

        // Add "Add New Skill" card
        html += `
            <div class="add-skill-card" onclick="dashboard.showAddSkillModal()">
                <i class="fas fa-plus-circle"></i>
                <h4>Add New Skill</h4>
                <p>Track a new skill</p>
            </div>
        `;

        grid.innerHTML = html;
    }

    calculateSkillProgress(skillName) {
        if (!this.habits || this.habits.length === 0) return 0;
        
        const relatedHabits = this.habits.filter(h => 
            h.title.toLowerCase().includes(skillName.toLowerCase()) ||
            h.category?.toLowerCase().includes(skillName.toLowerCase())
        );
        
        if (relatedHabits.length === 0) return 0;
        
        const totalCompletions = relatedHabits.reduce((sum, h) => 
            sum + (h.statistics?.totalCompletions || 0), 0
        );
        
        return Math.min(100, totalCompletions * 5);
    }

    logSkill(skillName) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2><i class="fas fa-pen"></i> Log ${skillName}</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Hours spent today</label>
                        <input type="number" id="logHours" min="0.5" step="0.5" value="1" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Notes (optional)</label>
                        <textarea id="logNotes" class="form-control" rows="3" placeholder="What did you learn?"></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn-submit" onclick="dashboard.saveSkillLog('${skillName}')">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button class="btn-cancel" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    saveSkillLog(skillName) {
        const hours = parseFloat(document.getElementById('logHours')?.value) || 1;
        const notes = document.getElementById('logNotes')?.value || '';
        
        // Update skill data
        const category = this.skills.find(c => 
            c.items.some(s => s.name === skillName)
        );
        
        if (category) {
            const skill = category.items.find(s => s.name === skillName);
            if (skill) {
                skill.hours = (skill.hours || 0) + hours;
                skill.completed = (skill.completed || 0) + 1;
                
                // Update progress
                skill.progress = Math.min(100, skill.progress + (hours * 2));
                
                // Update level based on progress
                if (skill.progress >= 80) skill.level = 'Advanced';
                else if (skill.progress >= 40) skill.level = 'Intermediate';
                else skill.level = 'Beginner';
            }
        }
        
        // Save to localStorage
        localStorage.setItem('dailyup_skills', JSON.stringify(this.skills));
        
        // Close modal
        document.querySelector('.modal')?.remove();
        
        // Refresh display
        this.renderSkills();
        
        this.showNotification(`✅ Logged ${hours}h for ${skillName}`, 'success');
    }

    viewSkillDetails(skillName) {
        // Find skill
        let skill = null;
        for (const category of this.skills) {
            const found = category.items.find(s => s.name === skillName);
            if (found) {
                skill = found;
                break;
            }
        }
        
        if (!skill) {
            this.showNotification('Skill not found', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-chart-line"></i> ${skillName} Details</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Current Level:</span>
                            <span style="color: var(--primary-color); font-weight: bold;">${skill.level}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Progress:</span>
                            <span style="color: var(--primary-color); font-weight: bold;">${skill.progress}%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Total Hours:</span>
                            <span style="color: var(--primary-color); font-weight: bold;">${skill.hours || 0}h</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Tasks Completed:</span>
                            <span style="color: var(--primary-color); font-weight: bold;">${skill.completed || 0}</span>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                        <h4 style="color: var(--primary-color); margin-bottom: 0.8rem;">📈 Recommendations</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${this.getSkillRecommendations(skillName, skill.level)}
                        </ul>
                    </div>
                    
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button class="btn-small" style="flex: 1;" onclick="dashboard.logSkill('${skillName}'); this.closest('.modal').remove()">
                            <i class="fas fa-plus"></i> Log Hours
                        </button>
                        <button class="btn-small" style="flex: 1; background: #ff3333;" onclick="dashboard.deleteSkill('${skillName}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                    
                    <button class="btn-submit" style="margin-top: 1rem;" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    getSkillRecommendations(skillName, level) {
        const recommendations = {
            'JavaScript': {
                'Beginner': [
                    '📘 Complete JavaScript basics on freeCodeCamp',
                    '🎯 Build a simple calculator app',
                    '📺 Watch "JavaScript for Beginners" tutorials'
                ],
                'Intermediate': [
                    '🚀 Learn ES6+ features',
                    '🔧 Build a todo app with localStorage',
                    '📚 Read "You Don\'t Know JS" book'
                ],
                'Advanced': [
                    '⚡ Learn design patterns in JS',
                    '🏗️ Build a full-stack application',
                    '📝 Contribute to open source'
                ]
            },
            'Python': {
                'Beginner': [
                    '🐍 Complete Python basics on Codecademy',
                    '📊 Work with lists and dictionaries',
                    '🔧 Build a simple calculator'
                ],
                'Intermediate': [
                    '📈 Learn pandas for data analysis',
                    '🌐 Build a web app with Flask',
                    '📚 Read "Automate the Boring Stuff"'
                ]
            },
            'Mathematics': {
                'Beginner': [
                    '🧮 Practice algebra daily',
                    '📐 Learn geometry basics',
                    '🔢 Solve 10 problems daily'
                ],
                'Intermediate': [
                    '📈 Study calculus derivatives',
                    '📊 Learn statistics',
                    '🎯 Practice on Khan Academy'
                ]
            }
        };
        
        const defaultRecs = {
            'Beginner': [
                '📖 Practice 30 minutes daily',
                '📝 Take notes while learning',
                '🎯 Set weekly goals'
            ],
            'Intermediate': [
                '🚀 Work on real projects',
                '👥 Join study groups',
                '📚 Read advanced materials'
            ],
            'Advanced': [
                '🏆 Teach others',
                '🎯 Create complex projects',
                '📝 Write blog posts'
            ]
        };
        
        const recs = recommendations[skillName]?.[level] || defaultRecs[level] || defaultRecs['Beginner'];
        
        return recs.map(r => `<li style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-chevron-right" style="color: var(--primary-color); font-size: 0.8rem;"></i>
            ${r}
        </li>`).join('');
    }

    deleteSkill(skillName) {
        if (!confirm(`Are you sure you want to delete ${skillName}?`)) return;
        
        // Find and remove skill
        for (let i = 0; i < this.skills.length; i++) {
            const category = this.skills[i];
            const index = category.items.findIndex(s => s.name === skillName);
            if (index !== -1) {
                category.items.splice(index, 1);
                break;
            }
        }
        
        // Remove empty categories
        this.skills = this.skills.filter(c => c.items.length > 0);
        
        // Save to localStorage
        localStorage.setItem('dailyup_skills', JSON.stringify(this.skills));
        
        // Close any open modals
        document.querySelector('.modal')?.remove();
        
        // Refresh display
        this.renderSkills();
        
        this.showNotification(`✅ ${skillName} deleted`, 'success');
    }

    showAddSkillModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2><i class="fas fa-plus-circle"></i> Add New Skill</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Skill Name *</label>
                        <input type="text" id="newSkillName" class="form-control" placeholder="e.g., TypeScript, Guitar, etc.">
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="newSkillCategory" class="form-control">
                            <option value="💻 Coding">💻 Coding</option>
                            <option value="📚 Academics">📚 Academics</option>
                            <option value="🤝 Soft Skills">🤝 Soft Skills</option>
                            <option value="💪 Fitness">💪 Fitness</option>
                            <option value="🎨 Creative">🎨 Creative</option>
                            <option value="🌎 Languages">🌎 Languages</option>
                            <option value="🎯 Other">🎯 Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Icon</label>
                        <select id="newSkillIcon" class="form-control">
                            <option value="fab fa-js">JavaScript</option>
                            <option value="fab fa-python">Python</option>
                            <option value="fas fa-calculator">Math</option>
                            <option value="fas fa-flask">Science</option>
                            <option value="fas fa-dumbbell">Fitness</option>
                            <option value="fas fa-guitar">Music</option>
                            <option value="fas fa-paint-brush">Art</option>
                            <option value="fas fa-code">Coding</option>
                            <option value="fas fa-book">Reading</option>
                            <option value="fas fa-language">Language</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Color</label>
                        <input type="color" id="newSkillColor" class="form-control" value="#00ff00" style="height: 50px;">
                    </div>
                    <div class="form-actions">
                        <button class="btn-submit" onclick="dashboard.saveNewSkill()">
                            <i class="fas fa-save"></i> Add Skill
                        </button>
                        <button class="btn-cancel" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    saveNewSkill() {
        const name = document.getElementById('newSkillName')?.value;
        const category = document.getElementById('newSkillCategory')?.value;
        const icon = document.getElementById('newSkillIcon')?.value;
        const color = document.getElementById('newSkillColor')?.value;
        
        if (!name) {
            this.showNotification('Please enter skill name', 'error');
            return;
        }
        
        // Find or create category
        let categoryObj = this.skills.find(c => c.category === category);
        if (!categoryObj) {
            categoryObj = {
                category: category,
                items: []
            };
            this.skills.push(categoryObj);
        }
        
        // Add new skill
        categoryObj.items.push({
            name: name,
            level: 'Beginner',
            progress: 0,
            icon: icon || 'fas fa-star',
            color: color || '#00ff00',
            completed: 0,
            hours: 0
        });
        
        // Save to localStorage
        localStorage.setItem('dailyup_skills', JSON.stringify(this.skills));
        
        // Close modal
        document.querySelector('.modal')?.remove();
        
        // Refresh display
        this.renderSkills();
        
        this.showNotification(`✅ ${name} added to skills!`, 'success');
    }

    // ========== MUSIC SYSTEM ==========
    setupMusicSystem() {
        const musicControl = document.createElement('div');
        musicControl.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 280px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid var(--primary-color);
            border-radius: 30px;
            padding: 0.5rem 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 1000;
            backdrop-filter: blur(5px);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        `;
        
        musicControl.innerHTML = `
            <i class="fas fa-music" style="color: var(--primary-color);"></i>
            <select id="musicSelect" style="
                background: transparent;
                border: 1px solid var(--border-color);
                color: var(--text-color);
                padding: 0.3rem;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                cursor: pointer;
            ">
                <option value="">🔇 No Music</option>
                <option value="lofi">🎵 Lo-Fi Study</option>
                <option value="coding">💻 Coding Beats</option>
            </select>
            <button id="musicPlayPause" class="music-btn" style="
                background: transparent;
                border: 1px solid var(--primary-color);
                color: var(--primary-color);
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <i class="fas fa-play"></i>
            </button>
            <input type="range" id="musicVolume" min="0" max="100" value="30" style="
                width: 80px;
                height: 4px;
                background: var(--border-color);
                border-radius: 2px;
                -webkit-appearance: none;
            ">
        `;
        
        document.body.appendChild(musicControl);
        
        this.lofiAudio = new Audio('/music/tuyo.mp3');
        this.codingAudio = new Audio('/music/coding.mp3');
        
        this.lofiAudio.loop = true;
        this.codingAudio.loop = true;
        this.lofiAudio.volume = 0.3;
        this.codingAudio.volume = 0.3;
        
        this.currentAudio = null;
        
        const musicSelect = document.getElementById('musicSelect');
        const musicPlayPause = document.getElementById('musicPlayPause');
        const musicVolume = document.getElementById('musicVolume');
        
        if (musicSelect) {
            musicSelect.addEventListener('change', (e) => {
                this.switchMusic(e.target.value);
            });
        }
        
        if (musicPlayPause) {
            musicPlayPause.addEventListener('click', () => {
                this.toggleMusic();
            });
        }
        
        if (musicVolume) {
            musicVolume.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
        }
    }
    
    switchMusic(type) {
        if (this.lofiAudio) {
            this.lofiAudio.pause();
            this.lofiAudio.currentTime = 0;
        }
        if (this.codingAudio) {
            this.codingAudio.pause();
            this.codingAudio.currentTime = 0;
        }
        
        if (type === 'lofi') {
            this.currentAudio = this.lofiAudio;
            this.currentAudio.play().catch(e => console.log('Audio play failed:', e));
            document.getElementById('musicPlayPause').innerHTML = '<i class="fas fa-pause"></i>';
        } else if (type === 'coding') {
            this.currentAudio = this.codingAudio;
            this.currentAudio.play().catch(e => console.log('Audio play failed:', e));
            document.getElementById('musicPlayPause').innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            this.currentAudio = null;
            document.getElementById('musicPlayPause').innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    toggleMusic() {
        if (!this.currentAudio) {
            const select = document.getElementById('musicSelect');
            if (select) {
                select.value = 'lofi';
                this.switchMusic('lofi');
            }
            return;
        }
        
        const playPauseBtn = document.getElementById('musicPlayPause');
        if (this.currentAudio.paused) {
            this.currentAudio.play().catch(e => console.log('Audio play failed:', e));
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            this.currentAudio.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    setVolume(volume) {
        if (this.lofiAudio) this.lofiAudio.volume = volume;
        if (this.codingAudio) this.codingAudio.volume = volume;
    }

    async verifyUser() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('Invalid token');
            
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

    async loadGamification() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/gamification/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                this.gamification = data;
                this.renderGamification();
            }
        } catch (error) {
            console.error('Failed to load gamification:', error);
        }
    }

    renderGamification() {
        const levelEl = document.getElementById('userLevel');
        if (levelEl && this.gamification) {
            levelEl.innerHTML = `
                <div class="level-badge">
                    <i class="fas fa-star"></i> Level ${this.gamification.gamification?.level || 1}
                </div>
            `;
        }
        
        const xpBar = document.getElementById('xpBar');
        if (xpBar && this.gamification) {
            const currentXP = this.gamification.gamification?.xp || 0;
            const nextLevelXP = this.gamification.gamification?.xpToNextLevel || 100;
            const percentage = (currentXP / nextLevelXP) * 100;
            
            xpBar.innerHTML = `
                <div class="xp-bar">
                    <div class="xp-fill" style="width: ${percentage}%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.3rem;">
                    <span>${currentXP} XP</span>
                    <span>Next: ${nextLevelXP} XP</span>
                </div>
            `;
        }
        
        const recentEl = document.getElementById('recentAchievements');
        if (recentEl && this.gamification?.achievements) {
            const recent = this.gamification.achievements
                .filter(a => a.completed)
                .slice(0, 3);
            
            if (recent.length > 0) {
                recentEl.innerHTML = recent.map(a => `
                    <div class="achievement-card completed" style="padding: 1rem;">
                        <div class="achievement-icon"><i class="${a.achievement?.icon || 'fas fa-medal'}"></i></div>
                        <h4 style="font-size: 0.9rem;">${a.achievement?.name || 'Achievement'}</h4>
                    </div>
                `).join('');
            } else {
                recentEl.innerHTML = '<p style="color: var(--text-muted);">No achievements yet</p>';
            }
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

        if (this.weeklyChart) this.weeklyChart.destroy();

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

        if (this.miniCalendar) this.miniCalendar.destroy();

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
                const data = await res.json();
                
                this.showNotification('✅ +50 XP!', 'success');
                
                try {
                    const audio = new Audio('/sound/notifiaction.mp3');
                    audio.volume = 0.3;
                    audio.play();
                } catch (e) {}
                
                if (data.levelUp) {
                    this.showLevelUp(data.newLevel);
                }
                
                await this.loadHabits();
                await this.loadStats();
                await this.loadGamification();
                
                this.renderHabits();
                this.renderStats();
                this.renderGamification();
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

    showLevelUp(level) {
        const animation = document.createElement('div');
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #00ff00, #00ccff);
            color: black;
            padding: 2rem 4rem;
            border-radius: 12px;
            font-size: 3rem;
            font-weight: bold;
            z-index: 10000;
            animation: levelUp 2s ease-out forwards;
            box-shadow: 0 0 50px rgba(0,255,0,0.5);
            text-align: center;
        `;
        animation.innerHTML = `LEVEL UP!<br><span style="font-size: 1.5rem;">Now Level ${level}</span>`;
        document.body.appendChild(animation);
        
        try {
            const audio = new Audio('/sound/levelup.mp3');
            audio.volume = 0.3;
            audio.play();
        } catch (e) {}
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}vw;
                    top: -20px;
                    width: 10px;
                    height: 10px;
                    background: ${['#00ff00', '#00ccff', '#ffaa00'][Math.floor(Math.random() * 3)]};
                    border-radius: 50%;
                    animation: confetti ${Math.random() * 3 + 2}s linear forwards;
                    z-index: 9999;
                `;
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 5000);
            }, i * 50);
        }
        
        setTimeout(() => animation.remove(), 3000);
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
                await this.loadGamification();
                
                this.renderHabits();
                this.renderStats();
                this.renderGamification();
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
                await this.loadGamification();
                
                this.renderHabits();
                this.renderStats();
                this.renderGamification();
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
            this.showNotification('Edit mode - modify and save', 'info');
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
    console.log('Loading page:', page);
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
        case 'pomodoro':
            this.loadPomodoroPage();
            break;
        case 'journal':
            this.loadJournalPage();
            break;
        case 'challenges':
            this.loadChallengesPage();
            break;
        case 'chat':
            this.loadChatPage();
            break;
        default:
            console.log('Unknown page:', page);
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

        if (this.calendar) this.calendar.destroy();

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

        const savedPicture = localStorage.getItem('profilePicture');
        const avatarHtml = savedPicture 
            ? `<img src="${savedPicture}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`
            : `<i class="fas fa-user-secret"></i>`;

        el.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem;">
                    <div style="position: relative;">
                        <div class="avatar" id="profileAvatar" style="width: 100px; height: 100px;">
                            ${avatarHtml}
                        </div>
                        <button onclick="dashboard.triggerProfileUpload()" style="
                            position: absolute;
                            bottom: 0;
                            right: 0;
                            background: var(--primary-color);
                            color: var(--dark-bg);
                            border: none;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            cursor: pointer;
                            border: 2px solid var(--dark-bg);
                        ">
                            <i class="fas fa-camera"></i>
                        </button>
                    </div>
                    <div>
                        <h3>${this.user.username}</h3>
                        <p style="color: var(--text-muted);">${this.user.email}</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem;">
                    <div class="stat-box">
                        <div class="stat-value">${this.user.streak?.current || 0}</div>
                        <div class="stat-label">Current Streak</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${this.user.streak?.longest || 0}</div>
                        <div class="stat-label">Longest Streak</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${this.stats.totalCompletions || 0}</div>
                        <div class="stat-label">Total Completions</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${new Date(this.user.createdAt || Date.now()).toLocaleDateString()}</div>
                        <div class="stat-label">Member Since</div>
                    </div>
                </div>
            </div>
        `;
    }
// ========== POMODORO PAGE ==========
loadPomodoroPage() {
    const el = document.getElementById('pomodoroContent');
    if (!el) return;
    
    // Redirect to full pomodoro page
    window.location.href = '/pomodoro';
}

// ========== JOURNAL PAGE ==========
loadJournalPage() {
    const el = document.getElementById('journalContent');
    if (!el) return;
    
    // Redirect to full journal page
    window.location.href = '/journal';
}

// ========== CHALLENGES PAGE ==========
loadChallengesPage() {
    const el = document.getElementById('challengesContent');
    if (!el) return;
    
    // Redirect to full challenges page
    window.location.href = '/challenges';
}

// ========== CHAT PAGE ==========
loadChatPage() {
    const el = document.getElementById('chatContent');
    if (!el) return;
    
    // Redirect to full chat page
    window.location.href = '/chat';
}
    triggerProfileUpload() {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.click();
    }

    setupEventListeners() {
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });

        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('userDropdown').classList.toggle('show');
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (this.lofiAudio) {
                    this.lofiAudio.pause();
                    this.lofiAudio.currentTime = 0;
                }
                if (this.codingAudio) {
                    this.codingAudio.pause();
                    this.codingAudio.currentTime = 0;
                }
                
                localStorage.clear();
                window.location.href = '/intro';
            });
        }

        document.addEventListener('click', () => {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('show');
        });

        const addHabitBtn = document.getElementById('addHabitBtn');
        if (addHabitBtn) {
            addHabitBtn.addEventListener('click', () => {
                document.getElementById('addHabitModal').style.display = 'flex';
            });
        }

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

        const habitForm = document.getElementById('habitForm');
        if (habitForm) {
            habitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewHabit();
            });
        }

        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                document.getElementById('notificationsPanel').classList.toggle('show');
            });
        }

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

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes levelUp {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes confetti {
        0% { transform: translateY(0) rotate(0); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    
    .xp-bar {
        width: 100%;
        height: 8px;
        background: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
        margin: 0.5rem 0;
    }
    
    .xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff00, #00ccff);
        border-radius: 4px;
        transition: width 0.3s ease;
    }
    
    .level-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.8rem;
        background: linear-gradient(135deg, #00ff0020, #00ccff20);
        border: 1px solid var(--primary-color);
        border-radius: 20px;
        color: var(--primary-color);
        font-weight: bold;
    }
    
    .music-btn:hover {
        background: var(--primary-color) !important;
        color: var(--dark-bg) !important;
    }
    
    #musicSelect option {
        background: var(--dark-bg);
        color: var(--text-color);
    }
    
    #musicVolume::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 15px;
        height: 15px;
        background: var(--primary-color);
        border-radius: 50%;
        cursor: pointer;
    }
    
    .category-header {
        grid-column: 1 / -1;
        margin-top: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .category-header h3 {
        color: var(--primary-color);
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .empty-skills {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        background: rgba(255,255,255,0.02);
        border: 2px dashed var(--border-color);
        border-radius: 12px;
    }
    
    .empty-skills i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }
    
    .empty-skills h3 {
        color: var(--text-color);
        margin-bottom: 0.5rem;
    }
    
    .empty-skills p {
        color: var(--text-muted);
        margin-bottom: 1.5rem;
    }
    
    .stat-box {
        background: rgba(255,255,255,0.02);
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
    }
    
    .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color);
    }
    
    .stat-label {
        color: var(--text-muted);
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});