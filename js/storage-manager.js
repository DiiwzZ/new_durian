// Storage Manager for Durian Analytics
// ====================================

class StorageManager {
    constructor() {
        this.storageKeys = CONFIG.STORAGE_KEYS;
    }

    // History Management
    saveAnalysisResult(data) {
        try {
            const key = this.storageKeys.HISTORY;
            const existingData = this.getHistory();
            
            const newItem = {
                id: Date.now().toString(),
                text: data.text,
                date: new Date().toLocaleString('th-TH', { hour12: false }),
                sentiment: data.sentiment,
                polarity: data.polarity,
                score: data.score,
                keywords: data.keywords,
                campaign: data.campaign,
                timestamp: Date.now()
            };
            
            existingData.unshift(newItem);
            
            // Keep only last 200 items
            const limitedData = existingData.slice(0, 200);
            
            localStorage.setItem(key, JSON.stringify(limitedData));
            return true;
        } catch (error) {
            console.error('Error saving analysis result:', error);
            return false;
        }
    }

    getHistory() {
        try {
            const key = this.storageKeys.HISTORY;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    clearHistory() {
        try {
            const key = this.storageKeys.HISTORY;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }

    // User Management
    saveUser(userData) {
        try {
            const key = this.storageKeys.USERS;
            const existingUsers = this.getUsers();
            
            // Check if user already exists
            const existingIndex = existingUsers.findIndex(u => u.username === userData.username);
            
            if (existingIndex >= 0) {
                existingUsers[existingIndex] = { ...existingUsers[existingIndex], ...userData };
            } else {
                existingUsers.push({
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    ...userData
                });
            }
            
            localStorage.setItem(key, JSON.stringify(existingUsers));
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            return false;
        }
    }

    getUsers() {
        try {
            const key = this.storageKeys.USERS;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    getCurrentUser() {
        try {
            const key = this.storageKeys.CURRENT_USER;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    setCurrentUser(userData) {
        try {
            const key = this.storageKeys.CURRENT_USER;
            localStorage.setItem(key, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Error setting current user:', error);
            return false;
        }
    }

    logout() {
        try {
            const key = this.storageKeys.CURRENT_USER;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error logging out:', error);
            return false;
        }
    }

    // Settings Management
    saveSettings(settings) {
        try {
            const key = 'durian_settings';
            localStorage.setItem(key, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    getSettings() {
        try {
            const key = 'durian_settings';
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : {
                domainTuner: true,
                geminiClassifier: false,
                theme: 'light'
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return {
                domainTuner: true,
                geminiClassifier: false,
                theme: 'light'
            };
        }
    }

    // Export/Import Data
    exportData() {
        try {
            const data = {
                history: this.getHistory(),
                users: this.getUsers(),
                settings: this.getSettings(),
                exportDate: new Date().toISOString(),
                version: CONFIG.APP_VERSION
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `durian-analytics-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.version || !data.exportDate) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Import data
                    if (data.history) {
                        localStorage.setItem(this.storageKeys.HISTORY, JSON.stringify(data.history));
                    }
                    
                    if (data.users) {
                        localStorage.setItem(this.storageKeys.USERS, JSON.stringify(data.users));
                    }
                    
                    if (data.settings) {
                        localStorage.setItem('durian_settings', JSON.stringify(data.settings));
                    }
                    
                    resolve(true);
                } catch (error) {
                    console.error('Error importing data:', error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }
}

// Create global instance
const storageManager = new StorageManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storageManager };
}
