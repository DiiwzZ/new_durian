// Authentication form handlers
// ============================

(function () {
    const redirectDelay = (CONFIG?.UI?.TOAST_DURATION ?? 2200) + 400;

    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', onLoginSubmit);
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', onRegisterSubmit);
        }

        const closeToastOnEscape = (event) => {
            if (event.key === 'Escape') {
                hideToast();
            }
        };

        document.addEventListener('keydown', closeToastOnEscape);
    });

    function onLoginSubmit(event) {
        event.preventDefault();

        const username = event.target.username?.value?.trim();
        const password = event.target.password?.value;

        if (!username || !password) {
            displayToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'error');
            return;
        }

        const result = authManager.login(username, password);

        if (result.success) {
            displayToast('เข้าสู่ระบบสำเร็จ', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, redirectDelay);
        } else {
            displayToast(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
        }
    }

    function onRegisterSubmit(event) {
        event.preventDefault();

        const username = event.target.username?.value?.trim();
        const email = event.target.email?.value?.trim();
        const password = event.target.password?.value;
        const confirmPassword = event.target.confirmPassword?.value;

        if (!username || !email || !password || !confirmPassword) {
            displayToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
            return;
        }

        if (password !== confirmPassword) {
            displayToast('รหัสผ่านไม่ตรงกัน', 'error');
            return;
        }

        const result = authManager.register(username, password, email);

        if (result.success) {
            authManager.login(username, password);
            displayToast('ลงทะเบียนสำเร็จ', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, redirectDelay);
        } else {
            displayToast(result.message || 'เกิดข้อผิดพลาดในการลงทะเบียน', 'error');
        }
    }

    function displayToast(message, type = 'info') {
        ensureToastContainer();

        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            window.alert(message);
        }
    }

    function hideToast() {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.style.opacity = '0';
        }
    }

    function ensureToastContainer() {
        if (!document.getElementById('toast')) {
            const toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
    }
})();

