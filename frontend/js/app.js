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

    // URLハッシュをクリア（OAuthトークンが残らないように）
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname);
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
}

// === 認証チェック・アプリ初期化 ===
(async () => {
    // onAuthStateChangeを先に登録して、OAuthハッシュからのセッション確立を拾う
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session) {
            initApp(session);
        } else if (event === 'SIGNED_OUT') {
            if (appInitialized) {
                // 初期化済みの場合のみリダイレクト（ユーザーがログアウトした）
                window.location.href = 'index.html';
            }
        }
    });

    // 明示的にセッションを取得（ハッシュがない通常アクセスの場合）
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        initApp(session);
    } else if (!window.location.hash) {
        // ハッシュフラグメントがない = OAuthリダイレクト直後ではない → 未ログイン
        window.location.href = 'index.html';
        return;
    }

    // OAuthリダイレクトの場合、セッション確立を待つ（最大5秒）
    if (!appInitialized) {
        setTimeout(() => {
            if (!appInitialized) {
                window.location.href = 'index.html';
            }
        }, 5000);
    }
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
