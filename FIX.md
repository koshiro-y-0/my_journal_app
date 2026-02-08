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

## 今回 - Django フロントエンド配信 + CORS修正

| ファイル | 修正内容 | 重要度 |
|---------|---------|--------|
| `backend/config/urls.py` | 開発時（`DEBUG=True`）にDjangoサーバーから `frontend/` ディレクトリの静的ファイルを配信するルーティングを追加。`http://localhost:8000` でログイン画面が開けるようになった | HIGH |
| `backend/config/settings.py:55-56` | CORS許可オリジンに `http://localhost:8000` と `http://127.0.0.1:8000` を追加 | MEDIUM |
