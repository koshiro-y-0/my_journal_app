/**
 * 日記CRUD操作
 * Django APIを通じて日記の作成・取得・編集・削除を行う
 */

// === 状態管理 ===
let currentJournal = null;  // 現在表示中の日記
let isEditing = false;      // 編集モードかどうか
let uploadedImageUrl = null; // アップロード済み画像URL
let selectedDate = null;     // 選択中の日付（YYYY-MM-DD）

// === 気分スコアの絵文字マッピング ===
const MOOD_EMOJIS = {
    1: '😢', 2: '😞', 3: '😔', 4: '😐', 5: '🙂',
    6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳',
};

// === 初期化 ===
function initJournal() {
    setupMoodSelector();
    setupImageUpload();
    setupFormEvents();
    setupViewEvents();
    loadTodayJournal();
}

// === 気分スコアスライダー ===
function setupMoodSelector() {
    const slider = document.getElementById('mood-score');
    const valueDisplay = document.getElementById('mood-value');
    const emojiDisplay = document.getElementById('mood-emoji');

    function updateMoodDisplay() {
        const val = parseInt(slider.value);
        valueDisplay.textContent = val;
        emojiDisplay.textContent = MOOD_EMOJIS[val] || '';
    }

    slider.addEventListener('input', updateMoodDisplay);
    updateMoodDisplay();
}

// === 画像アップロード ===
function setupImageUpload() {
    const fileInput = document.getElementById('journal-image');
    const selectBtn = document.getElementById('image-select-btn');
    const previewContainer = document.getElementById('image-preview-container');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');

    selectBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // ファイルサイズチェック（5MB）
        if (file.size > 5 * 1024 * 1024) {
            showJournalMessage('画像は5MB以下にしてください', 'error');
            fileInput.value = '';
            return;
        }

        // プレビュー表示
        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.src = ev.target.result;
            previewContainer.style.display = 'block';
            selectBtn.style.display = 'none';
        };
        reader.readAsDataURL(file);

        // アップロード
        await uploadImage(file);
    });

    removeBtn.addEventListener('click', () => {
        uploadedImageUrl = null;
        fileInput.value = '';
        previewContainer.style.display = 'none';
        preview.src = '';
        selectBtn.style.display = 'inline-flex';
    });
}

// === 画像をDjango APIにアップロード ===
async function uploadImage(file) {
    const progressEl = document.getElementById('image-upload-progress');
    progressEl.style.display = 'flex';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/journals/upload-image/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'アップロードに失敗しました');
        }

        uploadedImageUrl = data.image_url;
        showJournalMessage('画像をアップロードしました', 'success');
    } catch (err) {
        showJournalMessage(err.message, 'error');
        // プレビューをリセット
        document.getElementById('image-preview-container').style.display = 'none';
        document.getElementById('image-select-btn').style.display = 'inline-flex';
    } finally {
        progressEl.style.display = 'none';
    }
}

// === フォームイベント ===
function setupFormEvents() {
    const form = document.getElementById('journal-form');
    const cancelBtn = document.getElementById('journal-cancel-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveJournal();
    });

    cancelBtn.addEventListener('click', () => {
        if (currentJournal) {
            showJournalView(currentJournal);
        } else {
            resetForm();
        }
        isEditing = false;
    });
}

// === 日記表示エリアのイベント ===
function setupViewEvents() {
    document.getElementById('journal-edit-btn').addEventListener('click', () => {
        if (currentJournal) {
            startEditing(currentJournal);
        }
    });

    document.getElementById('journal-delete-btn').addEventListener('click', async () => {
        if (!currentJournal) return;
        if (!confirm('この日記を削除しますか？')) return;
        await deleteJournal(currentJournal.id);
    });
}

// === 今日の日記を読み込み ===
async function loadTodayJournal() {
    const today = getTodayDate();
    selectedDate = today;
    await loadJournalByDate(today);
}

// === 指定日の日記を読み込み（カレンダーから呼ばれる） ===
async function loadJournalByDate(date) {
    selectedDate = date;
    updateDateDisplay(date);
    showLoading(true);

    try {
        const headers = await getAuthHeaders();
        const month = date.substring(0, 7); // YYYY-MM

        const response = await fetch(`${API_BASE_URL}/journals/?month=${month}`, {
            headers: headers,
        });

        if (!response.ok) throw new Error('日記の取得に失敗しました');

        const journals = await response.json();
        const journal = journals.find(j => j.date === date);

        if (journal) {
            currentJournal = journal;
            showJournalView(journal);
        } else {
            currentJournal = null;
            showJournalForm(date);
        }
    } catch (err) {
        showJournalMessage(err.message, 'error');
    } finally {
        showLoading(false);
    }
}

// === 日記を保存（作成 or 更新） ===
async function saveJournal() {
    const content = document.getElementById('journal-content').value.trim();
    const moodScore = parseInt(document.getElementById('mood-score').value);

    if (!content) {
        showJournalMessage('日記の内容を入力してください', 'error');
        return;
    }

    const submitBtn = document.getElementById('journal-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';

    try {
        const headers = await getAuthHeaders();
        const date = selectedDate || getTodayDate();

        const body = {
            content: content,
            mood_score: moodScore,
            date: date,
            image_url: uploadedImageUrl || null,
        };

        let response;
        if (isEditing && currentJournal) {
            // 更新
            response = await fetch(`${API_BASE_URL}/journals/${currentJournal.id}/`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(body),
            });
        } else {
            // 新規作成
            response = await fetch(`${API_BASE_URL}/journals/`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '保存に失敗しました');
        }

        const wasEditing = isEditing;
        currentJournal = data;
        isEditing = false;
        showJournalView(data);
        showJournalMessage(wasEditing ? '日記を更新しました' : '日記を保存しました', 'success');

        // カレンダーの更新を通知（STEP 6で実装）
        if (typeof refreshCalendar === 'function') {
            refreshCalendar();
        }
        // 気分グラフの更新を通知（STEP 7で実装）
        if (typeof refreshMoodChart === 'function') {
            refreshMoodChart();
        }
    } catch (err) {
        showJournalMessage(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '日記を保存';
    }
}

// === 日記を削除 ===
async function deleteJournal(journalId) {
    try {
        const headers = await getAuthHeaders();

        const response = await fetch(`${API_BASE_URL}/journals/${journalId}/`, {
            method: 'DELETE',
            headers: headers,
        });

        if (!response.ok && response.status !== 204) {
            const data = await response.json();
            throw new Error(data.error || '削除に失敗しました');
        }

        currentJournal = null;
        uploadedImageUrl = null;
        showJournalForm(selectedDate);
        showJournalMessage('日記を削除しました', 'success');

        // カレンダー・グラフの更新を通知
        if (typeof refreshCalendar === 'function') refreshCalendar();
        if (typeof refreshMoodChart === 'function') refreshMoodChart();
    } catch (err) {
        showJournalMessage(err.message, 'error');
    }
}

// === 編集モードに入る ===
function startEditing(journal) {
    isEditing = true;
    document.getElementById('journal-content').value = journal.content;
    document.getElementById('mood-score').value = journal.mood_score;
    document.getElementById('mood-score').dispatchEvent(new Event('input'));

    // 画像があればプレビュー表示
    if (journal.image_url) {
        uploadedImageUrl = journal.image_url;
        const preview = document.getElementById('image-preview');
        preview.src = journal.image_url;
        document.getElementById('image-preview-container').style.display = 'block';
        document.getElementById('image-select-btn').style.display = 'none';
    } else {
        uploadedImageUrl = null;
        document.getElementById('image-preview-container').style.display = 'none';
        document.getElementById('image-select-btn').style.display = 'inline-flex';
    }

    document.getElementById('journal-submit-btn').textContent = '更新する';
    document.getElementById('journal-cancel-btn').style.display = 'inline-flex';

    document.getElementById('journal-form-container').style.display = 'block';
    document.getElementById('journal-view-container').style.display = 'none';
}

// === 日記表示モード ===
function showJournalView(journal) {
    document.getElementById('journal-form-container').style.display = 'none';
    document.getElementById('journal-view-container').style.display = 'block';

    // 本文
    const contentEl = document.getElementById('journal-view-content');
    contentEl.textContent = journal.content;

    // 気分スコア
    const moodEl = document.getElementById('journal-view-mood');
    const emoji = MOOD_EMOJIS[journal.mood_score] || '';
    moodEl.innerHTML = `<span class="mood-badge">${emoji} 気分: ${journal.mood_score}/10</span>`;

    // 画像
    const imageEl = document.getElementById('journal-view-image');
    if (journal.image_url) {
        imageEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = journal.image_url;
        img.alt = '日記の画像';
        img.className = 'journal-image';
        imageEl.appendChild(img);
    } else {
        imageEl.innerHTML = '';
    }

    // タイトル更新
    updateDateDisplay(journal.date);
}

// === 日記入力フォームを表示 ===
function showJournalForm(date) {
    resetForm();
    document.getElementById('journal-form-container').style.display = 'block';
    document.getElementById('journal-view-container').style.display = 'none';
    updateDateDisplay(date);

    // 今日以外の日付は注意書きを表示
    const today = getTodayDate();
    if (date !== today) {
        document.getElementById('journal-title').textContent = `${formatDateJapanese(date)}の日記`;
    } else {
        document.getElementById('journal-title').textContent = '今日の日記';
    }
}

// === フォームをリセット ===
function resetForm() {
    document.getElementById('journal-content').value = '';
    document.getElementById('mood-score').value = 5;
    document.getElementById('mood-score').dispatchEvent(new Event('input'));
    document.getElementById('journal-image').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('image-select-btn').style.display = 'inline-flex';
    document.getElementById('journal-submit-btn').textContent = '日記を保存';
    document.getElementById('journal-cancel-btn').style.display = 'none';
    uploadedImageUrl = null;
    isEditing = false;
}

// === UI ヘルパー ===

function showLoading(show) {
    document.getElementById('journal-loading').style.display = show ? 'flex' : 'none';
    if (show) {
        document.getElementById('journal-form-container').style.display = 'none';
        document.getElementById('journal-view-container').style.display = 'none';
    }
}

function showJournalMessage(message, type) {
    const el = document.getElementById('journal-message');
    el.textContent = message;
    el.className = `journal-message journal-message-${type}`;
    el.style.display = 'block';

    // 3秒後に自動で消す
    setTimeout(() => {
        el.style.display = 'none';
    }, 3000);
}

function updateDateDisplay(date) {
    const displayEl = document.getElementById('journal-date-display');
    if (displayEl) {
        displayEl.textContent = formatDateJapanese(date);
    }
}

function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateJapanese(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return `${parseInt(year)}年${parseInt(month)}月${parseInt(day)}日（${dayNames[d.getDay()]}）`;
}

// === 月別の日記一覧を取得（カレンダー用） ===
async function getJournalsByMonth(month) {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/journals/?month=${month}`, {
            headers: headers,
        });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}
