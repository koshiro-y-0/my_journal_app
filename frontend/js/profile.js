/**
 * プロフィールページ
 * ユーザー情報の表示・ログアウト
 */

function initProfile(session) {
    const user = session.user;

    // アバター（メールの頭文字）
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
        const initial = (user.email || '?')[0].toUpperCase();
        avatarEl.textContent = initial;
    }

    // メールアドレス
    const emailEl = document.getElementById('profile-email');
    if (emailEl) {
        emailEl.textContent = user.email || '不明';
    }

    // メタ情報
    const metaEl = document.getElementById('profile-meta');
    if (metaEl) {
        const createdAt = user.created_at;
        if (createdAt) {
            const date = new Date(createdAt);
            const y = date.getFullYear();
            const m = date.getMonth() + 1;
            const d = date.getDate();
            metaEl.textContent = `${y}年${m}月${d}日に登録`;
        }
    }

    // ログアウトボタン
    const logoutBtn = document.getElementById('profile-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }
}
