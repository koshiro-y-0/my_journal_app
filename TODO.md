# My Journal App - 実行計画 TODO

## Phase 1 - MVP 開発

---

### STEP 1: 環境構築・プロジェクト初期設定
- [x] 1-1. Djangoプロジェクトの作成（`backend/config`）
- [x] 1-2. Django必要パッケージのインストール・`requirements.txt` 作成
  - Django, djangorestframework, django-cors-headers, supabase-py, python-dotenv
- [x] 1-3. `.env` ファイルの作成（テンプレート）
- [x] 1-4. Django settings.py の基本設定（CORS、REST framework、環境変数読み込み）
- [x] 1-5. フロントエンドのディレクトリ構成作成（`frontend/`配下）
- [x] 1-6. Supabaseプロジェクトの作成・接続情報の取得 ※手動作業

---

### STEP 2: Supabase データベース・ストレージ設定
- [x] 2-1. Supabaseで `journals` テーブルを作成 ※手動 or SQL
  - id (uuid), user_id (uuid), content (text), mood_score (integer), image_url (text), date (date), created_at, updated_at
  - ユニーク制約: user_id + date
- [x] 2-2. RLSポリシーの設定（自分のデータのみアクセス可能）
- [x] 2-3. Supabase Storageバケットの作成（画像保存用） ※手動
- [x] 2-4. Storageのアクセスポリシー設定（認証ユーザーのみアップロード可）

---

### STEP 3: 認証機能
- [ ] 3-1. Supabase Authのメール/パスワード認証を有効化 ※手動
- [ ] 3-2. Supabase AuthのGoogle OAuth認証を設定 ※手動
  - Google Cloud ConsoleでOAuthクライアントID取得
  - SupabaseにGoogle Provider設定
- [ ] 3-3. Django側：認証ミドルウェア作成（Supabase JWTトークン検証）
- [ ] 3-4. Django側：認証関連のエンドポイント作成（`authentication/`アプリ）
- [ ] 3-5. フロントエンド：ログイン画面のHTML/CSS作成（`index.html`）
  - メール+パスワードフォーム
  - Googleログインボタン
  - サインアップフォーム
- [ ] 3-6. フロントエンド：`auth.js` 実装
  - Supabase Auth JS SDKでログイン/サインアップ/ログアウト
  - 認証状態の監視・リダイレクト処理
  - トークンの保存・Django APIリクエスト時にヘッダー付与

---

### STEP 4: 日記CRUD機能（バックエンド）
- [ ] 4-1. Django `journal` アプリの作成
- [ ] 4-2. `models.py`：Journalモデル定義（Supabase DBと対応）
- [ ] 4-3. `serializers.py`：日記データのシリアライザー作成
- [ ] 4-4. `views.py`：日記APIエンドポイント作成
  - POST `/api/journals/` - 日記作成（1日1件チェック）
  - GET `/api/journals/` - 日記一覧取得（月別フィルタ対応）
  - GET `/api/journals/<id>/` - 日記詳細取得
  - PUT `/api/journals/<id>/` - 日記編集
  - DELETE `/api/journals/<id>/` - 日記削除
- [ ] 4-5. `urls.py`：ルーティング設定
- [ ] 4-6. 画像アップロード処理（Supabase Storageへのアップロード・URL返却）

---

### STEP 5: 日記CRUD機能（フロントエンド）
- [ ] 5-1. メインアプリ画面のHTML/CSS作成（`app.html` + `style.css`）
  - レスポンシブ3カラムレイアウト（カレンダー / メイン / グラフ）
  - モバイル時は縦積み
- [ ] 5-2. `journal.js`：日記投稿フォームの実装
  - テキストエリア（日記本文）
  - 気分スコア選択UI（1〜10のスライダー or ボタン）
  - 画像アップロードUI（任意）
  - 1日1回制限の表示制御
- [ ] 5-3. `journal.js`：日記一覧・詳細表示の実装
- [ ] 5-4. `journal.js`：日記編集・削除の実装
- [ ] 5-5. `app.js`：アプリ初期化・認証チェック・画面切り替え

---

### STEP 6: カレンダー表示機能
- [ ] 6-1. `calendar.js`：月別カレンダーのレンダリング
- [ ] 6-2. 日記を書いた日を色付きでマーク表示
- [ ] 6-3. 日付クリックで該当日の日記を表示
- [ ] 6-4. 前月・翌月ナビゲーション
- [ ] 6-5. 連続投稿日数（ストリーク）の計算・表示
- [ ] 6-6. カレンダーのレスポンシブ対応

---

### STEP 7: 気分分析グラフ
- [ ] 7-1. Django側：月別気分データ取得APIの作成
  - GET `/api/journals/mood-stats/?month=YYYY-MM` - 月別気分スコア一覧
  - GET `/api/journals/mood-stats/average/` - 月平均スコア
- [ ] 7-2. `mood.js`：Chart.js を使った折れ線グラフの描画
  - X軸: 日付、Y軸: 気分スコア（1〜10）
- [ ] 7-3. 月別切り替え機能
- [ ] 7-4. 月平均スコアの表示
- [ ] 7-5. グラフのレスポンシブ対応

---

### STEP 8: デザイン・UI仕上げ
- [ ] 8-1. アースカラー系のカラーパレット定義（CSS変数）
- [ ] 8-2. フォント設定（Noto Sans JP / Rounded Mplus）
- [ ] 8-3. 温かみのあるUI装飾（角丸、影、グラデーションなど）
- [ ] 8-4. モバイル表示の最終調整
- [ ] 8-5. ローディング・エラー表示のUI

---

### STEP 9: テスト・動作確認
- [ ] 9-1. ユーザー登録 → ログイン → 日記投稿の一連のフローテスト
- [ ] 9-2. Google OAuth認証のテスト
- [ ] 9-3. 日記の編集・削除テスト
- [ ] 9-4. カレンダー表示・日付クリックのテスト
- [ ] 9-5. 気分グラフの表示テスト
- [ ] 9-6. レスポンシブ表示テスト（PC / タブレット / スマホ）
- [ ] 9-7. 1日1件制限の動作確認
- [ ] 9-8. 画像アップロードのテスト

---

## Phase 2 - 機能拡充（将来対応）

### STEP 10: RAGチャット機能
- [ ] 10-1. LLM選定（無償枠: Ollama / Gemini API等）
- [ ] 10-2. ベクトルDB選定・セットアップ
- [ ] 10-3. 日記データのベクトル化パイプライン構築
- [ ] 10-4. RAGチャットAPI実装（Django）
- [ ] 10-5. チャットUIの作成（フロントエンド）

### STEP 11: その他の追加機能
- [ ] 11-1. キーワード検索機能
- [ ] 11-2. ダークモード対応
- [ ] 11-3. マークダウン対応エディター
- [ ] 11-4. データエクスポート（JSON/PDF）
- [ ] 11-5. AI感情分析（日記本文の自動解析）
- [ ] 11-6. 複数ユーザー対応・公開機能

---

## 開発順序の方針
1. **STEP 1 → 2**: 環境とDBを整えて土台を作る
2. **STEP 3**: 認証を先に作り、以降の開発でログイン状態を前提にできるようにする
3. **STEP 4 → 5**: 日記のCRUDをバックエンド→フロントエンドの順で実装
4. **STEP 6**: カレンダー表示を追加
5. **STEP 7**: 気分分析グラフを追加
6. **STEP 8**: デザイン・UIの仕上げ
7. **STEP 9**: 全体テスト
8. **STEP 10〜11**: Phase 2は MVP完成後に着手
