# FIX.md - 修正履歴

## fc77424 - STEP 9: コードレビュー・バグ修正

### フロントエンド

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/js/journal.js:247-251` | `saveJournal()` で `isEditing` を `false` にした後にメッセージ判定していたため、常に「保存しました」と表示されるバグを修正。`wasEditing` 変数で事前に保持するようにした | CRITICAL |
| `frontend/js/auth.js:125-132` | `getAuthHeaders()` が `auth.js` と `app.js` に重複定義されていた問題を解消。`auth.js` 側を削除（`app.html` で使われる `app.js` 側を残す） | CRITICAL |
| `frontend/js/journal.js:381-386` | `showLoading(false)` 時に `journal-view-container` が常に非表示になるバグ修正。`show=true` の場合のみ両コンテナを非表示にするように変更 | HIGH |
| `frontend/js/journal.js:339-345` | 画像URL表示で `innerHTML` を使っていたXSS脆弱性を修正。`document.createElement('img')` + `.src` に変更 | MEDIUM |

### バックエンド

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `backend/journal/views.py:18-22` | `_validate_month()` 関数を追加。`month` パラメータの形式（YYYY-MM）をバリデーションするようにした。不正な形式で `split('-')` がクラッシュする問題を防止 | HIGH |
| `backend/journal/views.py:111` | `mood_stats` API: `month` パラメータに `_validate_month()` チェックを追加 | HIGH |
| `backend/journal/views.py:160-161` | `_get_journals` API: `month` パラメータに `_validate_month()` チェックを追加 | HIGH |
| `backend/authentication/middleware.py:30-32` | JWT署名検証が無効化されている箇所にTODOコメントを追記（本番対応の明記） | LOW |

---

## 160e4e0 - Django フロントエンド配信 + CORS修正

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `backend/config/urls.py` | 開発時（`DEBUG=True`）にDjangoサーバーから `frontend/` ディレクトリの静的ファイルを配信するルーティングを追加。`http://localhost:8000` でログイン画面が開けるようになった | HIGH |
| `backend/config/settings.py:55-56` | CORS許可オリジンに `http://localhost:8000` と `http://127.0.0.1:8000` を追加 | MEDIUM |

---

## 59b971f - 新規登録ボタンが押せない問題 + Google OAuth URL修正

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/js/config.js:3` | `SUPABASE_ANON_KEY` が1文字間違っていた（`s2g` → `s0g`）。これにより `supabase.createClient()` が失敗し、タブ切り替え等のイベントリスナーが全く登録されず、新規登録ボタンが反応しなかった | CRITICAL |
| `frontend/js/auth.js:92` | Google OAuthのリダイレクトURLを `/frontend/app.html` → `/app.html` に修正。Django配信では `/frontend/` プレフィックスが不要 | MEDIUM |

---

## 今回 - Supabase変数名の衝突でJS全体が動かない問題

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/js/auth.js` | `const supabase` → `const supabaseClient` にリネーム。Supabase CDNが `window.supabase` を作るため、同名の `const supabase` 宣言が `SyntaxError: Identifier 'supabase' has already been declared` を起こし、タブ切り替え含む全JSが動かなかった | CRITICAL |
| `frontend/js/app.js` | 同上。`const supabase` → `const supabaseClient` にリネーム | CRITICAL |
| `frontend/js/journal.js:92` | `supabase.auth.getSession()` → `supabaseClient.auth.getSession()` に修正 | CRITICAL |
