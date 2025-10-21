// UI Utilities for Durian Analytics
// ==================================

// Chart Management
class ChartManager {
    constructor() {
        this.sentimentChart = null;
        this.trendChart = null;
        this.initializeCharts();
    }

    initializeCharts() {
        // Initialize Sentiment Chart
        const sentimentCtx = document.getElementById('sentimentChart')?.getContext('2d');
        if (sentimentCtx) {
            this.sentimentChart = new Chart(sentimentCtx, {
                type: 'doughnut',
                data: { 
                    labels: ['เชิงบวก','เป็นกลาง','เชิงลบ'], 
                    datasets: [{
                        data: [0,0,0], 
                        backgroundColor: ['#4AD8B9','#FFB86B','#FF9248'], 
                        borderWidth: 0
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { position: 'bottom' } }, 
                    cutout: '70%' 
                }
            });
        }

        // Initialize Trend Chart
        const trendCtx = document.getElementById('trendChart')?.getContext('2d');
        if (trendCtx) {
            this.trendChart = new Chart(trendCtx, {
                type: 'line', 
                data: { 
                    labels: ['จ','อ','พ','พฤ','ศ','ส','อา'], 
                    datasets: [{
                        label: 'การพูดถึง', 
                        data: [1200,1900,3000,5000,4000,3500,4200], 
                        borderColor: '#4AD8B9', 
                        backgroundColor: 'rgba(74,216,185,.12)', 
                        fill: true, 
                        tension: .4, 
                        borderWidth: 2, 
                        pointRadius: 4
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    updateSentimentChart(tuned) {
        if (!this.sentimentChart) return;
        
        const polarity = tuned.polarity;
        const score = tuned.score;
        let pos = 0, neu = 0, neg = 0;
        
        if (polarity === 'positive') { 
            pos = score; 
            neu = Math.max(0, 100 - score - 5); 
            neg = 100 - pos - neu; 
        } else if (polarity === 'negative') { 
            neg = score; 
            neu = Math.max(0, 100 - score - 5); 
            pos = 100 - neg - neu; 
        } else { 
            neu = score; 
            pos = Math.max(0, 100 - score - 10); 
            neg = 100 - neu - pos; 
        }

        this.sentimentChart.data.datasets[0].data = [Math.round(pos), Math.round(neu), Math.round(neg)];
        this.sentimentChart.update();
        
        // Update metric values
        const posVal = document.getElementById('posVal');
        const neuVal = document.getElementById('neuVal');
        const negVal = document.getElementById('negVal');
        
        if (posVal) posVal.textContent = Math.round(pos) + '%';
        if (neuVal) neuVal.textContent = Math.round(neu) + '%';
        if (negVal) negVal.textContent = Math.round(neg) + '%';
    }
}

// UI Update Functions
function updateUIFromTuned(tuned) {
    const chartManager = window.chartManager || new ChartManager();
    window.chartManager = chartManager;
    
    chartManager.updateSentimentChart(tuned);
    
    // Update keywords
    updateKeywords(tuned.preprocess);
}

function updateKeywords(preprocess) {
    const posBox = document.getElementById('posKeywords');
    const negBox = document.getElementById('negKeywords');
    const mixBox = document.getElementById('mixKeywords');
    
    if (posBox) {
        posBox.innerHTML = '';
        (preprocess.pos || []).slice(0, 12).forEach(k => posBox.appendChild(createKeywordBadge(k)));
    }
    
    if (negBox) {
        negBox.innerHTML = '';
        (preprocess.neg || []).slice(0, 12).forEach(k => negBox.appendChild(createKeywordBadge(k)));
    }
    
    if (mixBox) {
        mixBox.innerHTML = '';
        (preprocess.keyword || []).slice(0, 12).forEach(k => mixBox.appendChild(createKeywordBadge(k)));
    }
}

function createKeywordBadge(word) {
    const span = document.createElement('span');
    span.className = 'keyword-item';
    span.textContent = word;
    return span;
}

// Campaign Rendering
function renderCampaign(json) {
    const box = document.getElementById('campaign-suggestions');
    if (!box) return;
    
    box.innerHTML = "";
    
    if (json?.taglines) {
        json.taglines.forEach(t => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = t;
            box.appendChild(div);
        });
    }
    
    if (json?.idea) {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = json.idea;
        box.appendChild(div);
    }
}

// Toast Notifications
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, CONFIG.UI.TOAST_DURATION);
}

// Loading Management
function showLoading(on = true) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    loading.style.display = on ? 'flex' : 'none';
}

// Utility Functions
const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ChartManager, 
        updateUIFromTuned, 
        updateKeywords, 
        createKeywordBadge, 
        renderCampaign, 
        showToast, 
        showLoading, 
        $, 
        $$ 
    };
}
