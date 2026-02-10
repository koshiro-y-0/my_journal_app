# FIX.md - 修正履歴

## 39f95e0 - Supabase変数名の衝突でJS全体が動かない問題

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/js/auth.js` | `const supabase` → `const supabaseClient` にリネーム。Supabase CDNが `window.supabase` を作るため、同名の `const supabase` 宣言が `SyntaxError: Identifier 'supabase' has already been declared` を起こし、タブ切り替え含む全JSが動かなかった | CRITICAL |
| `frontend/js/app.js` | 同上。`const supabase` → `const supabaseClient` にリネーム | CRITICAL |
| `frontend/js/journal.js:92` | `supabase.auth.getSession()` → `supabaseClient.auth.getSession()` に修正 | CRITICAL |

---

## 59b971f - 新規登録ボタンが押せない問題 + Google OAuth URL修正

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/js/config.js:3` | `SUPABASE_ANON_KEY` が1文字間違っていた（`s2g` → `s0g`）。これにより `supabase.createClient()` が失敗し、タブ切り替え等のイベントリスナーが全く登録されず、新規登録ボタンが反応しなかった | CRITICAL |
| `frontend/js/auth.js:92` | Google OAuthのリダイレクトURLを `/frontend/app.html` → `/app.html` に修正。Django配信では `/frontend/` プレフィックスが不要 | MEDIUM |

---

## 160e4e0 - Django フロントエンド配信 + CORS修正

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `backend/config/urls.py` | 開発時（`DEBUG=True`）にDjangoサーバーから `frontend/` ディレクトリの静的ファイルを配信するルーティングを追加。`http://localhost:8000` でログイン画面が開けるようになった | HIGH |
| `backend/config/settings.py:55-56` | CORS許可オリジンに `http://localhost:8000` と `http://127.0.0.1:8000` を追加 | MEDIUM |

---

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

## 新規登録タブでもGoogleボタンを使えるように

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/index.html:67` | Googleボタンのテキストを `<span id="google-btn-text">` で囲み、タブ切り替えでテキスト変更可能にした | LOW |
| `frontend/js/auth.js:21-23` | タブ切り替え時にGoogleボタンのテキストを「Googleでログイン」/「Googleで新規登録」に切り替える処理を追加 | MEDIUM |

---

## 5f7c5f5 - Googleログイン後にログイン画面に戻る問題 + 登録完了ページ追加

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/js/app.js` | Google OAuthリダイレクト直後、URLハッシュフラグメントからのセッション確立が完了する前に `getSession()` → `null` → `index.html` にリダイレクトされていた問題を修正。`onAuthStateChange` でセッション確立を待ち、ハッシュがある場合は即リダイレクトしないように変更 | CRITICAL |
| `frontend/signup-success.html` | 新規登録完了ページを新規作成。確認メールの案内とログイン画面への戻りリンクを表示 | MEDIUM |
| `frontend/js/auth.js:82` | サインアップ成功時のメッセージ表示を `signup-success.html` へのリダイレクトに変更 | MEDIUM |
| `frontend/css/style.css` | 登録完了ページ用のスタイル（`.signup-success-card`, `.success-icon` 等）を追加 | LOW |

---

## ログイン後即ログアウト問題 + 新規登録フロー変更

### ログイン後即ログアウト問題

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/js/app.js` | `onAuthStateChange` で `INITIAL_SESSION` / `TOKEN_REFRESHED` イベントも処理するように修正。また `SIGNED_OUT` イベントでは `appInitialized` が `true` の場合のみリダイレクトし、初期ロード時の誤リダイレクトを防止。OAuthハッシュもセッション確立後にクリア | CRITICAL |

### 新規登録フロー変更（メールのみ → 確認メール → パスワード設定）

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/index.html` | サインアップフォームからパスワード欄を削除。メールアドレスのみの入力に変更。ボタンテキストも「確認メールを送信」に変更 | HIGH |
| `frontend/js/auth.js` | サインアップ処理を `signUp` → `signInWithOtp`（Magic Link）に変更。メール確認後 `set-password.html` にリダイレクトする設定 | HIGH |
| `frontend/set-password.html` | パスワード設定ページを新規作成。メール内リンクからのリダイレクト先。セッション確立後にパスワード入力フォームを表示し、`updateUser` でパスワードを設定 | HIGH |
| `frontend/signup-success.html` | メッセージを更新。「パスワード設定ページに移動します」という案内に変更 | LOW |
| `frontend/css/style.css` | パスワード設定ページ用のローディングスタイル、サインアップヒントのスタイルを追加 | LOW |

**Supabase設定**: Redirect URLsに `http://localhost:8000/set-password.html` の追加が必要

---

## 画像選択ボタンが反応しない問題

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/app.html:59` | 上部の `<label for="journal-image">` の `for` 属性を削除。同じ `for` を持つ `label` が2つあり、クリックイベントが競合していた | HIGH |
| `frontend/app.html:61` | `input[type=file]` の `hidden` → `position: absolute; clip: rect(0,0,0,0); opacity: 0` に変更。`display: none` や `pointer-events: none` ではブラウザがファイルダイアログを開けない | HIGH |
| `frontend/app.html:62` | `<button>` → `<label for="journal-image">` に変更。ブラウザネイティブの `label-input` 紐付けでファイルダイアログを開く方式に変更 | HIGH |
| `frontend/js/journal.js` | `selectBtn.addEventListener('click', ...)` のJS経由 `fileInput.click()` を削除。`label` のネイティブ機能に委譲 | MEDIUM |
| `frontend/js/journal.js` | `selectBtn.style.display = 'inline-flex'` → `''` に修正。`label` 要素には `inline-flex` が不適切 | LOW |
| `frontend/css/style.css` | `#image-select-btn { cursor: pointer }` を追加 | LOW |

---

## 723d693 - UI大幅リデザイン: 本の見開き風レイアウト + ハンバーガーメニュー

### レイアウト変更

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/app.html` | 3カラムレイアウト（カレンダー/日記/気分グラフ）を削除。「開いた本の見開き」レイアウトに変更。左ページ=日記本文、右ページ=気分スコア+画像。ハンバーガーメニュー（サイドドロワー）を追加 | HIGH |
| `frontend/css/style.css` | 本の見開き風CSS（`.book`, `.book-page-left`, `.book-page-right`, `.book-spine`）を追加。紙質感の罫線テクスチャ、綴じ目の影、背表紙のグラデーション。ハンバーガーメニュースタイル（`.side-drawer`, `.menu-overlay`, `.hamburger-btn`）を追加。レスポンシブ対応（768px以下で縦積み） | HIGH |
| `frontend/js/app.js` | ハンバーガーメニューのopen/close処理を追加。`logout-btn`のnullチェック追加（プロフィールページにはlogout-btnがないため）。`initProfile()`の呼び出しを追加 | HIGH |
| `frontend/js/journal.js` | フォームが左右ページに分割されたことに対応。`journal-right-form`/`journal-right-view`の表示切り替えを追加。`form submit`イベント→`button click`イベントに変更。URLパラメータ`?date=YYYY-MM-DD`対応を追加。`initJournal()`にDOM存在チェックを追加（calendar.htmlでも読み込まれるため） | HIGH |

### 新規ページ

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `frontend/calendar.html` | カレンダー専用ページを新規作成。ヘッダー+ハンバーガーメニュー+大きなカレンダー表示。日付クリックで`app.html?date=YYYY-MM-DD`に遷移 | HIGH |
| `frontend/mood.html` | 気分推移グラフ専用ページを新規作成。Chart.js読み込み、大きなグラフ表示 | HIGH |
| `frontend/profile.html` | プロフィールページを新規作成。アバター（メール頭文字）、メールアドレス、登録日表示、ログアウトボタン | HIGH |
| `frontend/js/profile.js` | プロフィールページのロジック。`supabaseClient.auth.getUser()`でユーザー情報取得・表示 | MEDIUM |
| `frontend/js/calendar.js` | 日付クリック時、`loadJournalByDate`が存在しない場合（calendar.html上）は`app.html?date=`に遷移するよう変更 | MEDIUM |
