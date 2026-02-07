/**
 * カレンダー表示機能
 * 月別カレンダーのレンダリング、日記マーク表示、ストリーク計算
 */

// === 状態管理 ===
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed
let calendarJournals = []; // 当月の日記データ

// === 初期化 ===
function initCalendar() {
    renderCalendar();
    loadCalendarData();
}

// === カレンダーの更新（journal.jsから呼ばれる） ===
function refreshCalendar() {
    loadCalendarData();
}

// === 当月の日記データを読み込み ===
async function loadCalendarData() {
    const month = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
    calendarJournals = await getJournalsByMonth(month);
    updateCalendarMarks();
    updateStreak();
}

// === カレンダーをレンダリング ===
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    container.innerHTML = `
        <div class="calendar">
            <div class="calendar-nav">
                <button id="cal-prev" class="cal-nav-btn" title="前月">&lt;</button>
                <span class="calendar-month-label" id="cal-month-label">${calendarYear}年 ${monthNames[calendarMonth]}</span>
                <button id="cal-next" class="cal-nav-btn" title="翌月">&gt;</button>
            </div>
            <div class="calendar-header">
                <span class="cal-day-name cal-sun">日</span>
                <span class="cal-day-name">月</span>
                <span class="cal-day-name">火</span>
                <span class="cal-day-name">水</span>
                <span class="cal-day-name">木</span>
                <span class="cal-day-name">金</span>
                <span class="cal-day-name cal-sat">土</span>
            </div>
            <div class="calendar-grid" id="cal-grid"></div>
            <div class="calendar-streak" id="cal-streak"></div>
        </div>
    `;

    renderDays();
    setupCalendarNav();
}

// === 日付セルをレンダリング ===
function renderDays() {
    const grid = document.getElementById('cal-grid');
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = getTodayDate();

    let html = '';

    // 月初の前の空白セル
    for (let i = 0; i < firstDay; i++) {
        html += '<span class="cal-day cal-day-empty"></span>';
    }

    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today;
        const isSelected = dateStr === selectedDate;
        const dayOfWeek = new Date(calendarYear, calendarMonth, day).getDay();

        let classes = 'cal-day';
        if (isToday) classes += ' cal-today';
        if (isSelected) classes += ' cal-selected';
        if (dayOfWeek === 0) classes += ' cal-sun';
        if (dayOfWeek === 6) classes += ' cal-sat';

        html += `<span class="${classes}" data-date="${dateStr}">${day}</span>`;
    }

    grid.innerHTML = html;

    // 日付クリックイベント
    grid.querySelectorAll('.cal-day:not(.cal-day-empty)').forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.dataset.date;
            // 選択状態を更新
            grid.querySelectorAll('.cal-day').forEach(c => c.classList.remove('cal-selected'));
            cell.classList.add('cal-selected');
            // 日記を読み込み
            loadJournalByDate(date);
        });
    });
}

// === 日記がある日にマークを付ける ===
function updateCalendarMarks() {
    const grid = document.getElementById('cal-grid');
    if (!grid) return;

    // 既存のマークをクリア
    grid.querySelectorAll('.cal-day').forEach(cell => {
        cell.classList.remove('cal-has-journal');
        cell.removeAttribute('data-mood');
    });

    // 日記がある日にマーク追加
    calendarJournals.forEach(journal => {
        const cell = grid.querySelector(`[data-date="${journal.date}"]`);
        if (cell) {
            cell.classList.add('cal-has-journal');
            cell.setAttribute('data-mood', journal.mood_score);
        }
    });
}

// === ストリーク（連続投稿日数）を計算・表示 ===
async function updateStreak() {
    const streakEl = document.getElementById('cal-streak');
    if (!streakEl) return;

    try {
        // 今日から遡ってストリークを計算
        const today = new Date();
        let streak = 0;
        let checkDate = new Date(today);

        // 最大90日分チェック（3ヶ月分のデータを取得）
        const monthsToCheck = [];
        for (let i = 0; i < 3; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            monthsToCheck.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        // 月ごとのデータを取得
        let allJournals = [];
        for (const month of monthsToCheck) {
            const journals = await getJournalsByMonth(month);
            allJournals = allJournals.concat(journals);
        }

        // 日付セットを作成
        const journalDates = new Set(allJournals.map(j => j.date));

        // 今日から遡ってカウント
        while (true) {
            const dateStr = formatDateISO(checkDate);
            if (journalDates.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        if (streak > 0) {
            streakEl.innerHTML = `<span class="streak-badge">${streak}日連続投稿中！</span>`;
        } else {
            streakEl.innerHTML = '<span class="streak-text">今日の日記を書きましょう</span>';
        }
    } catch {
        streakEl.innerHTML = '';
    }
}

// === 前月・翌月ナビゲーション ===
function setupCalendarNav() {
    document.getElementById('cal-prev').addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar();
        loadCalendarData();
    });

    document.getElementById('cal-next').addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar();
        loadCalendarData();
    });
}

// === ヘルパー ===
function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
