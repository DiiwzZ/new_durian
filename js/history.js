// History page logic
// ===================

(function () {
    let modalChart = null;
    let historyEntries = [];

    document.addEventListener('DOMContentLoaded', () => {
        if (!authManager.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        attachModalHandlers();
        renderHistoryTable();
    });

    function renderHistoryTable() {
        historyEntries = storageManager.getHistory();
        const tableContainer = document.getElementById('history-table');

        if (!tableContainer) {
            return;
        }

        if (!historyEntries.length) {
            tableContainer.innerHTML = '<div style="padding:18px;text-align:center;color:#8aa">ไม่มีประวัติ</div>';
            return;
        }

        const rows = historyEntries
            .map((entry, index) => createHistoryRow(entry, index))
            .join('');

        tableContainer.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th class="cell-date">วันที่</th>
                        <th>ข้อความ</th>
                        <th class="cell-result">ผลลัพธ์</th>
                        <th>คำสำคัญ</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        tableContainer
            .querySelectorAll('tbody tr')
            .forEach((row) => row.addEventListener('click', () => openHistoryModal(Number(row.dataset.index))));
    }

    function createHistoryRow(entry, index) {
        const sentiment = entry.sentiment || '-';
        const polarity = entry.polarity || '-';
        const score = Math.round(entry.score || 0);
        const text = escapeHTML(entry.text || '');
        const date = escapeHTML(entry.date || '-');

        const posKeywords = (entry.keywords?.pos || []).slice(0, 6).map(createKeywordPill).join('');
        const negKeywords = (entry.keywords?.neg || []).slice(0, 6).map(createKeywordPill).join('');

        return `
            <tr data-index="${index}">
                <td class="cell-date">${date}</td>
                <td>${text}</td>
                <td class="cell-result"><b>${escapeHTML(sentiment)}</b> (${escapeHTML(polarity)} / ${score}%)</td>
                <td>${posKeywords}${negKeywords}</td>
            </tr>
        `;
    }

    function createKeywordPill(keyword) {
        return `<span class="pill">${escapeHTML(keyword)}</span>`;
    }

    function openHistoryModal(index) {
        const entry = historyEntries[index];
        if (!entry) return;

        const modal = document.getElementById('history-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        const detail = document.getElementById('modal-detail');
        if (detail) {
            detail.innerHTML = `
                <div><b>วันที่:</b> ${escapeHTML(entry.date || '-')}</div>
                <div style="margin:6px 0">
                    <b>ข้อความ:</b><br>
                    <span class="pill" style="display:inline-block;margin-top:6px">${escapeHTML(entry.text || '')}</span>
                </div>
                <div><b>ผลวิเคราะห์:</b> ${escapeHTML(entry.sentiment || '-')} (${escapeHTML(entry.polarity || '-')} / ${Math.round(entry.score || 0)}%)</div>
            `;
        }

        populateModalSuggestion(entry);
        renderModalChart(entry);
    }

    function populateModalSuggestion(entry) {
        const suggestionBox = document.getElementById('modal-suggestion');
        if (!suggestionBox) return;

        const idea = entry.campaign?.idea;
        const taglines = Array.isArray(entry.campaign?.taglines) ? entry.campaign.taglines : [];

        if (idea) {
            suggestionBox.textContent = idea;
        } else if (taglines.length) {
            suggestionBox.textContent = taglines.join(' • ');
        } else {
            suggestionBox.textContent = '—';
        }
    }

    function renderModalChart(entry) {
        const context = document.getElementById('modal-sentiment-chart')?.getContext('2d');
        if (!context) {
            return;
        }

        const dataset = calculateSentimentDataset(entry);

        if (modalChart) {
            modalChart.destroy();
        }

        modalChart = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: ['เชิงบวก', 'เป็นกลาง', 'เชิงลบ'],
                datasets: [
                    {
                        data: dataset.map((value) => Math.round(value)),
                        backgroundColor: ['#4AD8B9', '#FFB86B', '#FF9248'],
                        borderWidth: 0
                    }
                ]
            },
            options: { responsive: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
        });
    }

    function calculateSentimentDataset(entry) {
        const posKeywords = entry.keywords?.pos || [];
        const negKeywords = entry.keywords?.neg || [];
        const neutralKeywords = entry.keywords?.keyword || [];
        const keywordTotal = posKeywords.length + negKeywords.length + neutralKeywords.length;

        if (keywordTotal > 0) {
            return [
                (posKeywords.length / keywordTotal) * 100,
                (neutralKeywords.length / keywordTotal) * 100,
                (negKeywords.length / keywordTotal) * 100
            ];
        }

        const score = entry.score || 0;
        if (entry.polarity === 'positive') {
            const positive = score;
            const neutral = Math.max(0, 100 - positive - 5);
            const negative = 100 - positive - neutral;
            return [positive, neutral, negative];
        }

        if (entry.polarity === 'negative') {
            const negative = score;
            const neutral = Math.max(0, 100 - negative - 5);
            const positive = 100 - negative - neutral;
            return [positive, neutral, negative];
        }

        const neutral = score;
        const positive = Math.max(0, 100 - neutral - 10);
        const negative = 100 - neutral - positive;
        return [positive, neutral, negative];
    }

    function attachModalHandlers() {
        const modal = document.getElementById('history-modal');
        const closeButton = document.getElementById('history-modal-close');

        if (closeButton) {
            closeButton.addEventListener('click', closeHistoryModal);
        }

        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeHistoryModal();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeHistoryModal();
            }
        });
    }

    function closeHistoryModal() {
        const modal = document.getElementById('history-modal');
        if (!modal) return;

        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        if (modalChart) {
            modalChart.destroy();
            modalChart = null;
        }
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();

