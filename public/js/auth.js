// ==========================================
// AUTH.JS - ULTRA SIMPLE VERSION
// Developed by: UNSEEN-TERMINATION
// ==========================================

const API_URL = window.location.origin + '/api';

// Login function
async function login(email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard';
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        alert('Server not reachable');
    }
}

// Register function
async function register(username, email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard';
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        alert('Server not reachable');
    }
}

// Check login on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const page = window.location.pathname.split('/').pop();
    
    if (token && (page === 'login.html' || page === 'register.html')) {
        window.location.href = '/dashboard';
    }
    
    if (!token && page === 'dashboard.html') {
        window.location.href = '/login';
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            login(email, password);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword')?.value;
            
            if (password !== confirm) {
                alert('Passwords do not match');
                return;
            }
            register(username, email, password);
        });
    }
});