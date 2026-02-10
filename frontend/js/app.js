/**
 * アプリ初期化・認証チェック
 * 未ログイン時はログイン画面にリダイレクト
 * ハンバーガーメニュー制御
 */

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let appInitialized = false;

// === アプリ初期化関数 ===
function initApp(session) {
    if (appInitialized) return;
    appInitialized = true;

    // URLハッシュをクリア（OAuthトークンが残らないように）
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // ユーザーのメールアドレスを表示
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) {
        userEmailEl.textContent = session.user.email;
    }

    // 日記機能を初期化（app.htmlの場合のみ）
    if (typeof initJournal === 'function') {
        initJournal();
    }

    // カレンダーを初期化（calendar.htmlの場合のみ）
    if (typeof initCalendar === 'function') {
        initCalendar();
    }

    // 気分グラフを初期化（mood.htmlの場合のみ）
    if (typeof initMoodChart === 'function') {
        initMoodChart();
    }

    // プロフィールを初期化（profile.htmlの場合のみ）
    if (typeof initProfile === 'function') {
        initProfile(session);
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
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}

// === ハンバーガーメニュー ===
(function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const drawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('menu-overlay');
    const closeBtn = document.getElementById('drawer-close-btn');

    if (!hamburgerBtn || !drawer || !overlay) return;

    function openMenu() {
        drawer.classList.add('open');
        overlay.classList.add('active');
    }

    function closeMenu() {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    }

    hamburgerBtn.addEventListener('click', openMenu);
    overlay.addEventListener('click', closeMenu);
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }
})();

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
