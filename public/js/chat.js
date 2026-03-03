// ==========================================
// RANDOM CHAT SYSTEM - REAL DATA VERSION
// No random data - All real from database
// ==========================================

class ChatSystem {
    constructor() {
        this.user = null;
        this.chats = [];
        this.socket = io();
        this.apiUrl = window.location.origin + '/api';
        this.isAdmin = false;
        
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
            this.checkAdminStatus();
            this.init();
        } catch (e) {
            window.location.href = '/intro';
        }
    }

    async checkAdminStatus() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                this.user = data.user;
                this.isAdmin = data.user.role === 'admin';
                localStorage.setItem('user', JSON.stringify(this.user));
            }
        } catch (error) {
            console.error('Failed to check admin status:', error);
        }
    }

    async init() {
        try {
            this.updateUserInfo();
            this.setupSocket();
            await this.loadChats();
            this.setupEventListeners();
            this.startOnlineCounter();
            
            console.log('✅ Chat system ready with REAL data');
        } catch (error) {
            console.error('Chat initialization error:', error);
        }
    }

    updateUserInfo() {
        const elements = {
            'username': this.user?.username || 'User',
            'userEmail': this.user?.email || '',
            'streakCount': `${this.user?.streak?.current || 0} day streak`,
            'todayCompleted': '0',
            'totalHabits': '0'
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
    }

    setupSocket() {
        this.socket.on('connect', () => {
            console.log('✅ Connected to chat server');
            if (this.user && this.user.id) {
                this.socket.emit('join-user', this.user.id);
            }
        });

        this.socket.on('new-chat', (chat) => {
            console.log('New message received from server:', chat);
            this.chats.unshift(chat);
            this.renderChats();
            this.showNotification('New message!', 'info');
            this.playSound();
        });

        this.socket.on('new-reply', (data) => {
            console.log('New reply received:', data);
            const chat = this.chats.find(c => c._id === data.chatId);
            if (chat) {
                if (!chat.replies) chat.replies = [];
                chat.replies.push(data.reply);
                this.renderChats();
                this.showNotification('New reply!', 'info');
                this.playSound();
            }
        });

        this.socket.on('chat-removed', (chatId) => {
            this.chats = this.chats.filter(c => c._id !== chatId);
            this.renderChats();
            this.showNotification('A chat was removed by admin', 'warning');
        });

        this.socket.on('reply-removed', (data) => {
            const chat = this.chats.find(c => c._id === data.chatId);
            if (chat && chat.replies) {
                chat.replies = chat.replies.filter(r => r.user?.userId !== data.userId);
                this.renderChats();
            }
        });

        this.socket.on('connect_error', (err) => {
            console.log('Socket connection error:', err);
        });
    }

    async loadChats() {
        try {
            console.log('Loading chats from database...');
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.chats = await res.json();
                console.log(`Loaded ${this.chats.length} chats from database`);
                this.renderChats();
            } else {
                const error = await res.text();
                console.error('Failed to load chats:', error);
                this.showError('Failed to load messages from server');
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
            this.showError('Network error - check server connection');
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;
        
        const message = input.value.trim();
        
        if (!message) {
            this.showNotification('Please enter a message', 'error');
            return;
        }
        
        if (message.length > 500) {
            this.showNotification('Message too long (max 500 chars)', 'error');
            return;
        }

        try {
            console.log('Sending message to server:', message);
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Message saved to database:', data);
                input.value = '';
                document.getElementById('charCount').textContent = '0';
                this.showNotification('Message sent!', 'success');
            } else {
                const err = await res.json();
                console.error('Server error:', err);
                this.showNotification(err.error || 'Failed to send', 'error');
            }
        } catch (error) {
            console.error('Send message error:', error);
            this.showNotification('Network error - server not reachable', 'error');
        }
    }

    async sendReply(chatId) {
        const input = document.getElementById(`reply-${chatId}`);
        if (!input) return;
        
        const message = input.value.trim();
        
        if (!message) {
            this.showNotification('Please enter a reply', 'error');
            return;
        }

        try {
            console.log('Sending reply to server:', message);
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/chat/${chatId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });

            if (res.ok) {
                input.value = '';
                this.showNotification('Reply sent!', 'success');
            } else {
                const err = await res.json();
                console.error('Server error:', err);
                this.showNotification(err.error || 'Failed to reply', 'error');
            }
        } catch (error) {
            console.error('Reply error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    async kickUser(chatId, userId, username) {
        if (!confirm(`Kick ${username} from this chat?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/chat/${chatId}/kick/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                this.showNotification(`Kicked ${username}`, 'success');
            } else {
                const err = await res.json();
                this.showNotification(err.error || 'Failed to kick', 'error');
            }
        } catch (error) {
            console.error('Kick user error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    async deleteChat(chatId) {
        if (!confirm('Delete this entire chat? This action cannot be undone.')) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/chat/${chatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                this.showNotification('Chat deleted', 'success');
            } else {
                const err = await res.json();
                this.showNotification(err.error || 'Failed to delete', 'error');
            }
        } catch (error) {
            console.error('Delete chat error:', error);
            this.showNotification('Network error', 'error');
        }
    }

    renderChats() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (this.chats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>No messages yet</h3>
                    <p>Be the first to start a conversation! Your messages will be saved in the database.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.chats.map(chat => {
            const isOwnMessage = chat.user?.userId === this.user?.id;
            
            return `
                <div class="message-card ${isOwnMessage ? 'own-message' : ''} ${chat.user?.isAdmin ? 'admin-message' : ''}" id="chat-${chat._id}">
                    <div class="message-header">
                        <div class="user-info">
                            <span class="username">${chat.user?.username || 'Anonymous'}</span>
                            ${chat.user?.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                            ${this.isAdmin && !isOwnMessage ? `
                                <button class="kick-btn" onclick="chat.kickUser('${chat._id}', '${chat.user?.userId}', '${chat.user?.username}')">
                                    <i class="fas fa-ban"></i> Kick
                                </button>
                            ` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="timestamp">${this.formatTime(chat.createdAt)}</span>
                            ${this.isAdmin ? `
                                <button class="kick-btn" onclick="chat.deleteChat('${chat._id}')" style="background: #ff0000;">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="message-content">
                        ${this.escapeHtml(chat.message)}
                    </div>
                    
                    ${chat.replies && chat.replies.length > 0 ? `
                        <div class="reply-section">
                            ${chat.replies.map(reply => `
                                <div class="reply-card">
                                    <div class="reply-header">
                                        <div>
                                            <span class="reply-username">${reply.user?.username || 'Anonymous'}</span>
                                            ${reply.user?.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                                        </div>
                                        <span class="timestamp">${this.formatTime(reply.createdAt)}</span>
                                    </div>
                                    <div class="reply-text">${this.escapeHtml(reply.message)}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="reply-input-area">
                        <input type="text" id="reply-${chat._id}" class="reply-input" placeholder="Write a reply...">
                        <button class="reply-btn" onclick="chat.sendReply('${chat._id}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    formatTime(dateStr) {
        if (!dateStr) return 'Just now';
        
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour ago`;
        if (diffDays < 7) return `${diffDays} day ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        // Send message button
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Enter key to send
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', (e) => {
                const count = e.target.value.length;
                const charCount = document.getElementById('charCount');
                if (charCount) charCount.textContent = count;
            });
        }

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

    startOnlineCounter() {
        // Real online users count - get from socket.io
        this.socket.on('user-count', (count) => {
            const onlineEl = document.getElementById('onlineCount');
            if (onlineEl) onlineEl.textContent = count;
        });
    }

    playSound() {
        try {
            const audio = new Audio('/sound/notifiaction.mp3');
            audio.volume = 0.2;
            audio.play().catch(() => {});
        } catch (e) {}
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
        const container = document.getElementById('chatMessages');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ff3333;"></i>
                    <h3>${msg}</h3>
                    <p>Make sure the server is running and you're logged in.</p>
                    <button onclick="location.reload()" style="
                        background: #00ff00;
                        color: black;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        margin-top: 15px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Retry</button>
                </div>
            `;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.chat = new ChatSystem();
});