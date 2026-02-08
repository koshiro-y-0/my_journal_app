/**
 * アプリ初期化・認証チェック
 * 未ログイン時はログイン画面にリダイレクト
 */

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === 認証チェック・アプリ初期化 ===
(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // 未ログイン → ログイン画面へ
        window.location.href = 'index.html';
        return;
    }

    // ユーザーのメールアドレスを表示
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) {
        userEmailEl.textContent = session.user.email;
    }

    // 日記機能を初期化
    if (typeof initJournal === 'function') {
        initJournal();
    }

    // カレンダーを初期化
    if (typeof initCalendar === 'function') {
        initCalendar();
    }

    // 気分グラフを初期化
    if (typeof initMoodChart === 'function') {
        initMoodChart();
    }
})();

// === 認証状態の変化を監視 ===
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = 'index.html';
    }
});

// === ログアウト ===
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

/**
 * Django APIにリクエストを送る際のヘッダーを取得
 */
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return {};
    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
}
