/**
 * アプリ初期化・認証チェック
 * 未ログイン時はログイン画面にリダイレクト
 */

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let appInitialized = false;

// === アプリ初期化関数 ===
function initApp(session) {
    if (appInitialized) return;
    appInitialized = true;

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
}

// === 認証状態の変化を監視 ===
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        initApp(session);
    } else if (event === 'SIGNED_OUT') {
        window.location.href = 'index.html';
    }
});

// === 認証チェック・アプリ初期化 ===
(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        initApp(session);
    } else if (!window.location.hash) {
        // ハッシュフラグメントがない = OAuthリダイレクト直後ではない → 未ログイン
        window.location.href = 'index.html';
    }
    // ハッシュフラグメントがある場合はonAuthStateChangeがセッション確立を処理するのを待つ
    // 5秒以内にセッションが確立されなければログイン画面に戻す
    setTimeout(() => {
        if (!appInitialized) {
            window.location.href = 'index.html';
        }
    }, 5000);
})();

// === ログアウト ===
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});

/**
 * Django APIにリクエストを送る際のヘッダーを取得
 */
async function getAuthHeaders() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return {};
    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
}
