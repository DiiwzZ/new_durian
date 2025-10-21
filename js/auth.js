// Authentication System for Durian Analytics
// =========================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    // Load current user from localStorage
    loadCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            this.currentUser = null;
        }
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Login user
    login(username, password) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                this.currentUser = {
                    username: user.username,
                    id: user.id,
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
        }
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        // Redirect to login page
        window.location.href = 'login.html';
    }

    // Register new user
    register(username, password, email = '') {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if username already exists
            if (users.find(u => u.username === username)) {
                return { success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
            }
            
            const newUser = {
                id: Date.now().toString(),
                username: username,
                password: password,
                email: email,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            return { success: true, message: 'ลงทะเบียนสำเร็จ' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลงทะเบียน' };
        }
    }

    // Protect page - redirect to login if not authenticated
    protectPage() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Update navbar based on auth status
    updateNavbar() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        if (this.isLoggedIn()) {
            navMenu.innerHTML = `
                <a href="history.html" class="history-button"><span class="history-icon">📋</span> ประวัติ</a>
                <span class="user-info">สวัสดี, ${this.currentUser.username}</span>
                <button class="logout-button" onclick="authManager.logout()">ออกจากระบบ</button>
            `;
        } else {
            navMenu.innerHTML = `
                <a href="login.html" class="history-button">เข้าสู่ระบบ</a>
            `;
        }
    }

    // Check if user can save analysis
    canSaveAnalysis() {
        return this.isLoggedIn();
    }

    // Get user-specific storage key
    getUserStorageKey(baseKey) {
        if (this.isLoggedIn()) {
            return `${baseKey}_${this.currentUser.id}`;
        }
        return baseKey;
    }
}

// Create global instance
const authManager = new AuthManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager };
}
