/**
 * 気分分析グラフ
 * Chart.js を使って月別の気分スコア推移を折れ線グラフで表示
 */

// === 状態管理 ===
let moodChart = null;       // Chart.jsインスタンス
let moodChartYear = new Date().getFullYear();
let moodChartMonth = new Date().getMonth(); // 0-indexed

// === 初期化 ===
function initMoodChart() {
    renderMoodContainer();
    loadMoodData();
}

// === グラフの更新（journal.jsから呼ばれる） ===
function refreshMoodChart() {
    loadMoodData();
}

// === コンテナをレンダリング ===
function renderMoodContainer() {
    const container = document.getElementById('mood-container');
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    container.innerHTML = `
        <div class="mood-chart-wrapper">
            <div class="mood-nav">
                <button id="mood-prev" class="cal-nav-btn" title="前月">&lt;</button>
                <span class="mood-month-label" id="mood-month-label">${moodChartYear}年 ${monthNames[moodChartMonth]}</span>
                <button id="mood-next" class="cal-nav-btn" title="翌月">&gt;</button>
            </div>
            <div class="mood-chart-container">
                <canvas id="mood-chart-canvas"></canvas>
            </div>
            <div class="mood-average" id="mood-average"></div>
            <div class="mood-no-data" id="mood-no-data" style="display: none;">
                <p>この月のデータはありません</p>
            </div>
        </div>
    `;

    setupMoodNav();
}

// === 気分データを読み込み ===
async function loadMoodData() {
    const month = `${moodChartYear}-${String(moodChartMonth + 1).padStart(2, '0')}`;
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    // ラベル更新
    const label = document.getElementById('mood-month-label');
    if (label) label.textContent = `${moodChartYear}年 ${monthNames[moodChartMonth]}`;

    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/journals/mood-stats/?month=${month}`, {
            headers: headers,
        });

        if (!response.ok) throw new Error('気分データの取得に失敗しました');

        const result = await response.json();

        if (result.data && result.data.length > 0) {
            document.getElementById('mood-no-data').style.display = 'none';
            renderChart(result.data, month);
            renderAverage(result.average, result.count);
        } else {
            document.getElementById('mood-no-data').style.display = 'block';
            renderAverage(0, 0);
            if (moodChart) {
                moodChart.destroy();
                moodChart = null;
            }
        }
    } catch {
        document.getElementById('mood-no-data').style.display = 'block';
        if (moodChart) {
            moodChart.destroy();
            moodChart = null;
        }
    }
}

// === Chart.js で折れ線グラフを描画 ===
function renderChart(data, month) {
    const canvas = document.getElementById('mood-chart-canvas');
    if (!canvas) return;

    // 月の日数を取得
    const [year, mon] = month.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(mon), 0).getDate();

    // 全日付のラベルとデータを準備
    const labels = [];
    const scores = [];

    for (let day = 1; day <= daysInMonth; day++) {
        labels.push(`${day}`);
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        const entry = data.find(d => d.date === dateStr);
        scores.push(entry ? entry.mood_score : null);
    }

    // 既存チャートを破棄
    if (moodChart) {
        moodChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    moodChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '気分スコア',
                data: scores,
                borderColor: '#C07A50',
                backgroundColor: 'rgba(192, 122, 80, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: function(context) {
                    const value = context.raw;
                    if (value === null) return 'transparent';
                    if (value <= 3) return '#C75050';
                    if (value <= 5) return '#E8C84A';
                    if (value <= 7) return '#8EBF8E';
                    return '#6B9E6B';
                },
                pointBorderColor: function(context) {
                    const value = context.raw;
                    if (value === null) return 'transparent';
                    if (value <= 3) return '#C75050';
                    if (value <= 5) return '#E8C84A';
                    if (value <= 7) return '#8EBF8E';
                    return '#6B9E6B';
                },
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3,
                fill: true,
                spanGaps: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: 'rgba(74, 55, 40, 0.9)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(items) {
                            const idx = items[0].dataIndex;
                            return `${parseInt(mon)}月${idx + 1}日`;
                        },
                        label: function(item) {
                            const emojis = {
                                1: '😢', 2: '😞', 3: '😔', 4: '😐', 5: '🙂',
                                6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳',
                            };
                            const val = item.raw;
                            return `気分: ${val}/10 ${emojis[val] || ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        font: { size: 11 },
                        color: '#B8A494',
                    },
                    grid: {
                        color: 'rgba(226, 213, 200, 0.5)',
                    },
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        color: '#B8A494',
                        maxRotation: 0,
                        callback: function(value, index) {
                            // 5日ごとにラベル表示
                            const day = index + 1;
                            if (day === 1 || day % 5 === 0 || day === daysInMonth) {
                                return day;
                            }
                            return '';
                        }
                    },
                    grid: {
                        display: false,
                    },
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}

// === 月平均を表示 ===
function renderAverage(average, count) {
    const el = document.getElementById('mood-average');
    if (!el) return;

    if (count === 0) {
        el.innerHTML = '';
        return;
    }

    const emojis = {
        1: '😢', 2: '😞', 3: '😔', 4: '😐', 5: '🙂',
        6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳',
    };
    const roundedAvg = Math.round(average);
    const emoji = emojis[roundedAvg] || '';

    el.innerHTML = `
        <div class="mood-avg-card">
            <span class="mood-avg-emoji">${emoji}</span>
            <div class="mood-avg-info">
                <span class="mood-avg-label">月平均</span>
                <span class="mood-avg-value">${average}</span>
            </div>
            <span class="mood-avg-count">${count}件</span>
        </div>
    `;
}

// === 月ナビゲーション ===
function setupMoodNav() {
    document.getElementById('mood-prev').addEventListener('click', () => {
        moodChartMonth--;
        if (moodChartMonth < 0) {
            moodChartMonth = 11;
            moodChartYear--;
        }
        loadMoodData();
    });

    document.getElementById('mood-next').addEventListener('click', () => {
        moodChartMonth++;
        if (moodChartMonth > 11) {
            moodChartMonth = 0;
            moodChartYear++;
        }
        loadMoodData();
    });
}
