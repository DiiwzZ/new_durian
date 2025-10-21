// Durian Analytics - Configuration File
// =====================================

const CONFIG = {
    // API Keys
    AIFORTHAI_API_KEY: "DAL6vk7IdeeHntRei5mDvYFBXN18Qmp5",
    GEMINI_API_KEY: "AIzaSyBahSAr0ptYZ6bCyl2yfK1ZlfU6eMHRe5g",
    
    // API Endpoints
    AIFORTHAI_ENDPOINT: "https://api.aiforthai.in.th/ssense",
    GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    
    // Application Settings
    APP_NAME: "Durian Analytics",
    APP_VERSION: "1.0.0",
    APP_DESCRIPTION: "วิเคราะห์ความรู้สึกและสร้างแคมเปญสำหรับทุเรียน",
    
    // Default Settings
    DEFAULT_MAX_TOKENS: 2048,
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
    
    // Storage Keys
    STORAGE_KEYS: {
        HISTORY: 'durian_history',
        USERS: 'users',
        CURRENT_USER: 'currentUser'
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 2200,
        LOADING_DELAY: 100,
        ANIMATION_DURATION: 300
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
