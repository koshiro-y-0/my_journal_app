/**
 * 認証関連の処理
 * Supabase Auth JS SDKを使用してログイン/サインアップ/ログアウトを管理
 */

// Supabaseクライアントの初期化
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === タブ切り替え ===
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // タブのアクティブ状態を切り替え
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // フォームの表示切り替え
        const tabName = tab.dataset.tab;
        document.getElementById('login-form').style.display = tabName === 'login' ? 'block' : 'none';
        document.getElementById('signup-form').style.display = tabName === 'signup' ? 'block' : 'none';

        // Googleボタンのテキストを切り替え
        const googleBtnText = document.getElementById('google-btn-text');
        googleBtnText.textContent = tabName === 'login' ? 'Googleでログイン' : 'Googleで新規登録';

        // メッセージをクリア
        hideMessages();
    });
});

// === ログイン処理 ===
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showError(error.message);
            return;
        }

        // ログイン成功 → メインアプリに遷移
        window.location.href = 'app.html';
    } catch (err) {
        showError('ログインに失敗しました。もう一度お試しください。');
    }
});

// === サインアップ処理（Magic Linkでメール確認） ===
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById('signup-email').value;

    try {
        // Magic Linkを送信（パスワード設定ページにリダイレクト）
        const { data, error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/set-password.html',
            },
        });

        if (error) {
            showError(error.message);
            return;
        }

        // 登録完了ページにリダイレクト
        window.location.href = 'signup-success.html';
    } catch (err) {
        showError('確認メールの送信に失敗しました。もう一度お試しください。');
    }
});

// === Googleログイン ===
document.getElementById('google-login-btn').addEventListener('click', async () => {
    hideMessages();

    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/app.html',
            },
        });

        if (error) {
            showError(error.message);
        }
    } catch (err) {
        showError('Googleログインに失敗しました。');
    }
});

// === 認証状態の監視 ===
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        // ログイン済みならメインアプリへリダイレクト
        window.location.href = 'app.html';
    }
});

// ページ読み込み時に認証状態をチェック
(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'app.html';
    }
})();

// === ユーティリティ関数 ===

function showError(message) {
    const el = document.getElementById('auth-error');
    el.textContent = message;
    el.style.display = 'block';
}

function showSuccess(message) {
    const el = document.getElementById('auth-success');
    el.textContent = message;
    el.style.display = 'block';
}

function hideMessages() {
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-success').style.display = 'none';
}
