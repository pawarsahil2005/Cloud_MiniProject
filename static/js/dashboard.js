/**
 * ═══════════════════════════════════════════════════════════
 * Student Performance Prediction Dashboard - Frontend Logic
 * Cloud Computing Mini-Project
 * ═══════════════════════════════════════════════════════════
 */

// ── Color Map ──
const CLASS_COLORS = {
    'Excellent': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🏆', css: 'excellent' },
    'Good':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '👏', css: 'good' },
    'Average':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '📊', css: 'average' },
    'At Risk':   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '🚨', css: 'at-risk' }
};

// ── Chart instances (for cleanup) ──
let featureImportanceChart = null;
let batchChart = null;
let analyticsFeatureChart = null;
let featurePieChart = null;

// ══════════════════════════════════════════
// DOM READY
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initPredictionForm();
    initBatchUpload();
    initResetButton();
    loadAnalyticsCharts();
});

// ══════════════════════════════════════════
// SIDEBAR NAVIGATION
// ══════════════════════════════════════════
function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');

    // Toggle sidebar on mobile
    if (toggle) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && e.target !== toggle) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Nav link smooth scroll + active state
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            const section = document.getElementById(sectionId);

            if (section) {
                // Show section if hidden
                section.style.display = '';

                // Smooth scroll
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Close mobile sidebar
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });
}

// ══════════════════════════════════════════
// PREDICTION FORM
// ══════════════════════════════════════════
function initPredictionForm() {
    const form = document.getElementById('prediction-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handlePrediction();
    });
}

async function handlePrediction() {
    const features = [
        'study_hours', 'attendance', 'internal_marks',
        'termwork_marks', 'previous_cgpa', 'certifications_completed'
    ];

    // Gather input
    const data = {};
    for (const feat of features) {
        const el = document.getElementById(feat);
        if (!el || el.value === '') {
            showToast(`Please fill in "${feat.replace(/_/g, ' ')}"`, 'error');
            el && el.focus();
            return;
        }
        data[feat] = parseFloat(el.value);
    }

    showLoading(true);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === 'error') {
            const msg = result.errors ? result.errors.join(', ') : result.message;
            showToast(msg, 'error');
            return;
        }

        displayResults(result);
        displaySuggestions(result.suggestions);
        showToast(`Predicted: ${result.prediction} (${result.confidence}% confidence)`, 'success');

    } catch (err) {
        console.error('Prediction error:', err);
        showToast('Network error. Is the server running?', 'error');
    } finally {
        showLoading(false);
    }
}

// ══════════════════════════════════════════
// DISPLAY RESULTS
// ══════════════════════════════════════════
function displayResults(result) {
    // Show results section
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = '';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Also show suggestions section
    document.getElementById('suggestions-section').style.display = '';

    const prediction = result.prediction;
    const confidence = result.confidence;
    const classInfo = CLASS_COLORS[prediction] || CLASS_COLORS['Average'];

    // Result icon
    document.getElementById('result-icon').textContent = classInfo.icon;

    // Result badge
    const badge = document.getElementById('result-badge');
    badge.textContent = prediction;
    badge.className = 'result-badge ' + classInfo.css;

    // Result card glow
    const resultCard = document.getElementById('result-card');
    resultCard.style.borderColor = classInfo.color + '40';
    resultCard.style.boxShadow = `0 0 40px ${classInfo.color}15`;

    // Confidence bar
    const confBar = document.getElementById('confidence-bar');
    const confValue = document.getElementById('confidence-value');
    confValue.textContent = confidence.toFixed(1) + '%';

    // Set bar color based on confidence
    if (confidence >= 80) {
        confBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    } else if (confidence >= 60) {
        confBar.style.background = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
    } else if (confidence >= 40) {
        confBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
        confBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    }

    // Animate bar
    confBar.style.width = '0%';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            confBar.style.width = confidence + '%';
        });
    });

    // Class probabilities
    displayProbabilities(result.class_probabilities);

    // Feature importance chart
    renderFeatureImportanceChart(result.feature_importance);

    // Update active nav
    updateActiveNav('results-section');
}

function displayProbabilities(probs) {
    const container = document.getElementById('probabilities-container');
    container.innerHTML = '';

    const sortedEntries = Object.entries(probs).sort((a, b) => b[1] - a[1]);

    sortedEntries.forEach(([cls, prob], index) => {
        const info = CLASS_COLORS[cls] || { color: '#94a3b8' };

        const item = document.createElement('div');
        item.className = 'prob-item';
        item.style.animationDelay = (index * 0.1) + 's';
        item.innerHTML = `
            <span class="prob-label">${cls}</span>
            <div class="prob-bar-track">
                <div class="prob-bar-fill" style="width: 0%; background: ${info.color};"></div>
            </div>
            <span class="prob-value" style="color: ${info.color}">${prob.toFixed(1)}%</span>
        `;
        container.appendChild(item);

        // Animate
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                item.querySelector('.prob-bar-fill').style.width = prob + '%';
            });
        });
    });
}

// ══════════════════════════════════════════
// FEATURE IMPORTANCE CHART (Result Panel)
// ══════════════════════════════════════════
function renderFeatureImportanceChart(importanceData) {
    const ctx = document.getElementById('featureImportanceChart');
    if (!ctx) return;

    if (featureImportanceChart) {
        featureImportanceChart.destroy();
    }

    const sorted = Object.entries(importanceData).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([k]) => formatLabel(k));
    const values = sorted.map(([, v]) => (v * 100).toFixed(1));

    const gradientColors = [
        'rgba(99, 102, 241, 0.85)',
        'rgba(139, 92, 246, 0.80)',
        'rgba(167, 139, 250, 0.75)',
        'rgba(59, 130, 246, 0.70)',
        'rgba(96, 165, 250, 0.65)',
        'rgba(147, 197, 253, 0.60)'
    ];

    const borderColors = [
        '#6366f1', '#8b5cf6', '#a78bfa',
        '#3b82f6', '#60a5fa', '#93c5fd'
    ];

    featureImportanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Importance (%)',
                data: values,
                backgroundColor: gradientColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => `Importance: ${ctx.raw}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 11 } },
                    max: Math.ceil(Math.max(...values) / 10) * 10 + 5
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 12, weight: 500 } }
                }
            }
        }
    });
}

// ══════════════════════════════════════════
// BATCH CSV UPLOAD
// ══════════════════════════════════════════
function initBatchUpload() {
    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('csv-file-input');
    const fileNameEl = document.getElementById('file-name');
    const batchBtn = document.getElementById('batch-predict-btn');

    if (!zone || !input) return;

    // Click to browse
    zone.addEventListener('click', () => input.click());

    // Drag & drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            handleFileSelect(input.files[0], fileNameEl, batchBtn);
        }
    });

    // File selected
    input.addEventListener('change', () => {
        if (input.files.length) {
            handleFileSelect(input.files[0], fileNameEl, batchBtn);
        }
    });

    // Batch predict button
    batchBtn.addEventListener('click', async () => {
        if (!input.files.length) {
            showToast('Please select a CSV file first.', 'error');
            return;
        }
        await handleBatchPrediction(input.files[0]);
    });
}

function handleFileSelect(file, fileNameEl, batchBtn) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showToast('Please select a .csv file.', 'error');
        return;
    }
    fileNameEl.textContent = `📄 ${file.name} (${formatFileSize(file.size)})`;
    batchBtn.disabled = false;
    batchBtn.style.opacity = '1';
}

async function handleBatchPrediction(file) {
    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/batch_predict', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status === 'error') {
            showToast(result.message, 'error');
            return;
        }

        displayBatchResults(result);
        showToast(`Batch prediction complete: ${result.total_records} records processed.`, 'success');

    } catch (err) {
        console.error('Batch prediction error:', err);
        showToast('Network error during batch prediction.', 'error');
    } finally {
        showLoading(false);
    }
}

// ══════════════════════════════════════════
// DISPLAY BATCH RESULTS
// ══════════════════════════════════════════
function displayBatchResults(result) {
    const card = document.getElementById('batch-results-card');
    card.style.display = '';

    // Summary stats
    const summaryEl = document.getElementById('batch-summary');
    summaryEl.innerHTML = '';

    // Total card
    summaryEl.innerHTML += `
        <div class="batch-stat total">
            <span class="batch-stat-count">${result.total_records}</span>
            <span class="batch-stat-label">Total</span>
        </div>
    `;

    const classOrder = ['Excellent', 'Good', 'Average', 'At Risk'];
    classOrder.forEach(cls => {
        const count = result.summary[cls] || 0;
        const info = CLASS_COLORS[cls];
        summaryEl.innerHTML += `
            <div class="batch-stat ${info.css}">
                <span class="batch-stat-count">${count}</span>
                <span class="batch-stat-label">${cls}</span>
            </div>
        `;
    });

    // Batch doughnut chart
    renderBatchChart(result.summary);

    // Results table
    const tableWrapper = document.getElementById('batch-table-wrapper');
    const tbody = document.getElementById('batch-table-body');
    tbody.innerHTML = '';

    const maxDisplay = Math.min(result.results.length, 50);
    for (let i = 0; i < maxDisplay; i++) {
        const r = result.results[i];
        const info = CLASS_COLORS[r.prediction] || CLASS_COLORS['Average'];
        tbody.innerHTML += `
            <tr>
                <td>${r.row}</td>
                <td><span class="prediction-tag ${info.css}">${r.prediction}</span></td>
                <td>${r.confidence.toFixed(1)}%</td>
                <td><span class="status-dot" style="background:${info.color}"></span>${r.prediction}</td>
            </tr>
        `;
    }

    if (result.results.length > 50) {
        tbody.innerHTML += `
            <tr><td colspan="4" style="text-align:center;color:var(--text-muted)">
                ... and ${result.results.length - 50} more records
            </td></tr>
        `;
    }

    tableWrapper.style.display = '';
}

function renderBatchChart(summary) {
    const ctx = document.getElementById('batchChart');
    if (!ctx) return;

    if (batchChart) batchChart.destroy();

    const classOrder = ['Excellent', 'Good', 'Average', 'At Risk'];
    const values = classOrder.map(cls => summary[cls] || 0);
    const colors = classOrder.map(cls => CLASS_COLORS[cls].color);
    const bgColors = classOrder.map(cls => CLASS_COLORS[cls].bg);

    batchChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: classOrder,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: 'rgba(10, 14, 26, 1)',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 16,
                        font: { size: 12, weight: 500 },
                        usePointStyle: true,
                        pointStyleWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            }
        }
    });
}

// ══════════════════════════════════════════
// SUGGESTIONS DISPLAY
// ══════════════════════════════════════════
function displaySuggestions(suggestions) {
    const placeholder = document.getElementById('suggestions-placeholder');
    const content = document.getElementById('suggestions-content');

    if (!suggestions) return;

    placeholder.style.display = 'none';
    content.style.display = '';

    let html = `
        <div class="suggestion-header">
            <span class="suggestion-header-icon">${suggestions.icon}</span>
            <div class="suggestion-header-text">
                <h4 style="color: ${suggestions.color}">${suggestions.title}</h4>
                <p>Personalized recommendations based on your prediction</p>
            </div>
        </div>
        <ul class="suggestion-list">
    `;

    suggestions.suggestions.forEach((s, i) => {
        html += `
            <li class="suggestion-item" style="animation-delay: ${i * 0.08}s">
                <span class="si-icon" style="color: ${suggestions.color}">✦</span>
                <span>${s}</span>
            </li>
        `;
    });

    html += '</ul>';

    // Personalized suggestions
    if (suggestions.personalized && suggestions.personalized.length > 0) {
        html += `
            <div class="personalized-section">
                <h5><i class="bi bi-exclamation-triangle-fill" style="color: #f59e0b"></i> Personalized Alerts</h5>
        `;
        suggestions.personalized.forEach((p, i) => {
            html += `<div class="personalized-item" style="animation-delay: ${(i + 5) * 0.08}s">${p}</div>`;
        });
        html += '</div>';
    }

    content.innerHTML = html;
}

// ══════════════════════════════════════════
// ANALYTICS CHARTS (loaded on page init)
// ══════════════════════════════════════════
async function loadAnalyticsCharts() {
    try {
        const response = await fetch('/feature_importance');
        const result = await response.json();

        if (result.status !== 'success') return;

        renderAnalyticsBarChart(result.feature_importance);
        renderFeaturePieChart(result.feature_importance);

    } catch (err) {
        console.error('Failed to load analytics:', err);
    }
}

function renderAnalyticsBarChart(importanceData) {
    const ctx = document.getElementById('analyticsFeatureChart');
    if (!ctx) return;

    if (analyticsFeatureChart) analyticsFeatureChart.destroy();

    const sorted = Object.entries(importanceData).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([k]) => formatLabel(k));
    const values = sorted.map(([, v]) => (v * 100).toFixed(1));

    const barColors = [
        '#6366f1', '#8b5cf6', '#a78bfa',
        '#3b82f6', '#60a5fa', '#93c5fd'
    ];

    analyticsFeatureChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Importance (%)',
                data: values,
                backgroundColor: barColors.map(c => c + 'cc'),
                borderColor: barColors,
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.65
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => `Importance: ${ctx.raw}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 11, weight: 500 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 },
                        callback: (v) => v + '%'
                    }
                }
            }
        }
    });
}

function renderFeaturePieChart(importanceData) {
    const ctx = document.getElementById('featurePieChart');
    if (!ctx) return;

    if (featurePieChart) featurePieChart.destroy();

    const sorted = Object.entries(importanceData).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([k]) => formatLabel(k));
    const values = sorted.map(([, v]) => (v * 100).toFixed(1));

    const pieColors = [
        '#6366f1', '#8b5cf6', '#3b82f6',
        '#10b981', '#f59e0b', '#ef4444'
    ];

    featurePieChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: pieColors.map(c => c + '55'),
                borderColor: pieColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 14,
                        font: { size: 11, weight: 500 },
                        usePointStyle: true,
                        pointStyleWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw}%`
                    }
                }
            },
            scales: {
                r: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { display: false },
                    pointLabels: { display: false }
                }
            }
        }
    });
}

// ══════════════════════════════════════════
// RESET BUTTON
// ══════════════════════════════════════════
function initResetButton() {
    const resetBtn = document.getElementById('reset-btn');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', () => {
        // Hide results
        document.getElementById('results-section').style.display = 'none';

        // Reset suggestions
        const placeholder = document.getElementById('suggestions-placeholder');
        const content = document.getElementById('suggestions-content');
        if (placeholder) placeholder.style.display = '';
        if (content) { content.style.display = 'none'; content.innerHTML = ''; }
        document.getElementById('suggestions-section').style.display = 'none';

        // Reset confidence
        document.getElementById('confidence-bar').style.width = '0%';
        document.getElementById('confidence-value').textContent = '0%';
        document.getElementById('result-badge').textContent = '—';
        document.getElementById('result-badge').className = 'result-badge';

        updateActiveNav('prediction-section');
    });
}

// ══════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
    // Create toast container if not exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icon = type === 'error' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill';
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    toast.innerHTML = `<i class="bi ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function formatLabel(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function updateActiveNav(sectionId) {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
    });
}
