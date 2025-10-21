// Main Application Logic for Durian Analytics
// ===========================================

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing Durian Analytics...');
    
    // Update navbar based on auth status
    authManager.updateNavbar();
    
    // Load settings
    loadSettings();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Initialize charts
    window.chartManager = new ChartManager();
    
    console.log('Application initialized successfully');
}

function loadSettings() {
    const settings = storageManager.getSettings();
    
    // Apply settings to UI
    const domainTunerCheckbox = document.getElementById('domain-tuner');
    const geminiClassifierCheckbox = document.getElementById('gemini-classifier');
    
    if (domainTunerCheckbox) {
        domainTunerCheckbox.checked = settings.domainTuner;
    }
    
    if (geminiClassifierCheckbox) {
        geminiClassifierCheckbox.checked = settings.geminiClassifier;
    }
}

function saveSettings() {
    const settings = {
        domainTuner: document.getElementById('domain-tuner')?.checked || true,
        geminiClassifier: document.getElementById('gemini-classifier')?.checked || false,
        theme: 'light'
    };
    
    storageManager.saveSettings(settings);
}

function setupEventListeners() {
    // Main analyze button
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyze);
    }
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSave);
    }
    
    // Settings checkboxes
    const domainTunerCheckbox = document.getElementById('domain-tuner');
    const geminiClassifierCheckbox = document.getElementById('gemini-classifier');
    
    if (domainTunerCheckbox) {
        domainTunerCheckbox.addEventListener('change', saveSettings);
    }
    
    if (geminiClassifierCheckbox) {
        geminiClassifierCheckbox.addEventListener('change', saveSettings);
    }
}

async function handleAnalyze() {
    const text = document.getElementById('analysis-text')?.value?.trim();
    const validation = document.getElementById('validation');
    
    if (!text) {
        if (validation) {
            validation.textContent = 'กรุณาใส่ข้อความที่ต้องการวิเคราะห์';
            validation.style.display = 'block';
        }
        return;
    }
    
    if (validation) {
        validation.style.display = 'none';
    }
    
    showLoading(true);
    
    try {
        // Step 1: Get raw analysis from AI for Thai
        const raw = await callAIForthai(text);
        
        // Step 2: Apply domain tuning if enabled
        const useTuner = document.getElementById('domain-tuner')?.checked || true;
        let tuned = useTuner ? domainTune(text, raw) : { 
            polarity: raw?.sentiment?.polarity || 'neutral', 
            score: parseFloat(raw?.sentiment?.score || '50'), 
            preprocess: raw?.preprocess || {} 
        };

        // Step 3: Use Gemini for additional analysis if enabled
        if (document.getElementById('gemini-classifier')?.checked && CONFIG.GEMINI_API_KEY) {
            try {
                const judge = await callGeminiJudge(text);
                if (['positive','neutral','negative'].includes(judge.label)) {
                    // Use Gemini result if confidence is high or polarity is neutral
                    if (judge.confidence > CONFIG.DEFAULT_CONFIDENCE_THRESHOLD || tuned.polarity === 'neutral') {
                        tuned.polarity = judge.label;
                        tuned.score = (judge.label === 'neutral') ? 50 : Math.min(100, 60 + (judge.confidence * 40));
                        
                        // Add keywords from Gemini
                        if (judge.keywords && judge.keywords.length > 0) {
                            if (judge.label === 'positive') {
                                tuned.preprocess.pos = [...(tuned.preprocess.pos || []), ...judge.keywords];
                            } else if (judge.label === 'negative') {
                                tuned.preprocess.neg = [...(tuned.preprocess.neg || []), ...judge.keywords];
                            } else {
                                tuned.preprocess.keyword = [...(tuned.preprocess.keyword || []), ...judge.keywords];
                            }
                        }
                        
                        console.log('Gemini Judge Result:', judge);
                    }
                }
            } catch (e) { 
                console.warn('Gemini Judge Error:', e); 
            }
        }

        // Step 4: Update UI
        updateUIFromTuned(tuned);

        // Step 5: Generate campaign
        try {
            const keywords = [...(tuned.preprocess.pos || []), ...(tuned.preprocess.neg || []), ...(tuned.preprocess.keyword || [])];
            const campaign = await callGeminiCampaign(text, tuned.polarity, keywords);
            renderCampaign(campaign);
            
            // Store campaign data for saving
            window.currentAnalysis = {
                text,
                polarity: tuned.polarity,
                score: tuned.score,
                sentiment: toThaiPolarity(tuned.polarity),
                keywords: tuned.preprocess,
                campaign
            };
        } catch (e) {
            console.warn('Campaign generation error:', e);
            renderCampaign({ 
                taglines: [
                    "ราชาแห่งรสชาติ สดใหม่จากสวน",
                    "หวาน มัน หอม — คัดพิเศษ", 
                    "คุ้มทุกคำ ส่งไวถึงบ้าน"
                ], 
                idea: "(โหมดสำรอง) ตั้งค่า GEMINI_API_KEY เพื่อให้ AI เขียนแคมเปญตามจริง" 
            });
        }

        // Step 6: Show save button (only if user is logged in)
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn && authManager.canSaveAnalysis()) {
            saveBtn.style.display = 'inline-block';
        } else if (saveBtn && !authManager.canSaveAnalysis()) {
            saveBtn.style.display = 'none';
        }
        
        showToast('วิเคราะห์สำเร็จ');
        
    } catch (err) {
        console.error('Analysis error:', err);
        showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

function handleSave() {
    if (!window.currentAnalysis) {
        showToast('ไม่มีข้อมูลที่จะบันทึก', 'error');
        return;
    }
    
    // Check if user is logged in
    if (!authManager.canSaveAnalysis()) {
        showToast('กรุณาเข้าสู่ระบบเพื่อบันทึกผลการวิเคราะห์', 'error');
        return;
    }
    
    const success = storageManager.saveAnalysisResult(window.currentAnalysis);
    
    if (success) {
        showToast('บันทึกผลลงประวัติแล้ว');
        
        // Hide save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
        
        // Clear current analysis
        window.currentAnalysis = null;
    } else {
        showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
}

// Export for global access
window.DurianAnalytics = {
    handleAnalyze,
    handleSave,
    initializeApp
};
