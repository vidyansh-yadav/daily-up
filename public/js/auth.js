// API base URL
// API base URL - Works on localhost and render
const API_URL = window.location.origin + '/api';

// ... rest of the code remains same

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (token && (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === '' || currentPage === 'index.html')) {
        window.location.href = 'dashboard.html';
    } else if (!token && currentPage === 'dashboard.html') {
        window.location.href = 'login.html';
    }
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

// Register function
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    
    // Style the error message
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff3333;
        color: white;
        padding: 1rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00ff00;
        color: #000;
        padding: 1rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Initialize auth
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            await login(email, password);
        });
    }
    
    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            await register(username, email, password);
        });
    }
    
    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Show password toggle
    const showPasswordBtns = document.querySelectorAll('.show-password');
    showPasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            btn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    });
    
    // Matrix background animation
    const matrixBg = document.querySelector('.matrix-background');
    if (matrixBg) {
        // Create falling characters effect
        function createFallingChar() {
            const char = document.createElement('div');
            char.textContent = Math.random() > 0.5 ? '0' : '1';
            char.style.cssText = `
                position: absolute;
                color: rgba(0, 255, 0, ${Math.random() * 0.3 + 0.1});
                font-size: ${Math.random() * 20 + 10}px;
                top: -30px;
                left: ${Math.random() * 100}%;
                animation: fall ${Math.random() * 3 + 2}s linear infinite;
            `;
            
            matrixBg.appendChild(char);
            
            setTimeout(() => {
                char.remove();
            }, 5000);
        }
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Create initial characters
        for (let i = 0; i < 20; i++) {
            setTimeout(() => createFallingChar(), i * 100);
        }
        
        // Continue creating characters
        setInterval(createFallingChar, 100);
    }
    
    // Terminal typing effect on index page
    const typingElement = document.querySelector('.typing');
    if (typingElement) {
        const texts = [
            'npm start habit-tracker',
            'git commit -m "Daily progress"',
            './build-success.sh',
            'echo "Keep coding!"'
        ];
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        function type() {
            const currentText = texts[textIndex];
            
            if (isDeleting) {
                typingElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
            }
            
            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                setTimeout(type, 2000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                setTimeout(type, 500);
            } else {
                setTimeout(type, isDeleting ? 50 : 100);
            }
        }
        
        setTimeout(type, 1000);
    }
});