# My Journal App - プロジェクト仕様書

## 概要
自分専用の日記Webアプリケーション。1日1回その日の出来事を記録し、気分の推移を可視化する。
将来的には他のユーザーにも公開予定。最終的にはRAGを活用し、過去の自分とチャットできる機能を目指す。

## 技術スタック
- **フロントエンド**: HTML / CSS / JavaScript（バニラJS）
- **バックエンド**: Python / Django（APIサーバー）
- **BaaS**: Supabase
  - データベース（PostgreSQL）
  - 認証（Google認証 + メール/パスワード認証）
  - ストレージ（画像保存）
- **グラフ描画**: Chart.js
- **バージョン管理**: Git / GitHub
  - リポジトリ: https://github.com/koshiro-y-0/my_journal_app.git

## アーキテクチャ
```
[ブラウザ (HTML/CSS/JS)]
        │
        ▼
[Django APIサーバー (Python)]
        │
        ├── Supabase DB（日記データ・ユーザーデータ）
        ├── Supabase Auth（認証）
        ├── Supabase Storage（画像）
        └── (Phase 2) RAG / LLM（過去の自分とチャット）
```

## ディレクトリ構成
```
my_journal_app/
├── frontend/
│   ├── index.html          # ログイン画面
│   ├── app.html            # メインアプリ画面
│   ├── css/
│   │   └── style.css       # スタイルシート
│   ├── js/
│   │   ├── auth.js         # 認証関連
│   │   ├── journal.js      # 日記CRUD操作
│   │   ├── calendar.js     # カレンダー表示
│   │   ├── mood.js         # 気分グラフ描画
│   │   └── app.js          # アプリ初期化
│   └── assets/             # 画像・アイコンなど
├── backend/
│   ├── manage.py
│   ├── config/             # Djangoプロジェクト設定
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── journal/            # 日記アプリ
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── serializers.py
│   ├── authentication/     # 認証アプリ
│   │   ├── views.py
│   │   └── urls.py
│   └── requirements.txt
├── .gitignore
├── .env                    # 環境変数（Git管理外）
└── CLAUDE.md
```

## 機能一覧

### Phase 1 - MVP
1. **認証機能**
   - Google OAuth認証でのログイン
   - メールアドレス（またはID）+ パスワードでのサインアップ / ログイン
   - ログアウト
   - 認証状態の管理（未ログイン時はログイン画面にリダイレクト）

2. **日記投稿（1日1回）**
   - その日の出来事をテキストで記録
   - 今日の気分を10段階で選択（必須）
   - 画像を任意で添付（Supabase Storageに保存）
   - 日記の編集・削除

3. **カレンダー表示**
   - 月別カレンダーで日記を書いた日をマーク（色付き表示）
   - カレンダーの日付クリックで該当日の日記を表示
   - 前月・翌月への移動
   - 連続投稿日数（ストリーク）の表示

4. **気分分析グラフ**
   - サイドバーまたは専用ページで表示
   - 月別の気分スコア推移を折れ線グラフで表示（Chart.js）
   - 月ごとの平均気分スコア

### Phase 2 - 機能拡充（将来対応）
- **RAGチャット**: 過去の日記データを読み込ませて「過去の自分」とチャット
  - LLM: 開発時に最適なもの（無償枠）を選定
  - ベクトルDB: 検討中
  - Python で構築
- キーワード検索
- ダークモード
- マークダウン対応エディター
- データエクスポート（JSON/PDF）
- AI感情分析（日記本文から感情を自動解析）
- 複数ユーザー対応・公開機能

## データモデル

### journals テーブル（Supabase PostgreSQL）
| カラム名      | 型          | 説明                          |
|--------------|-------------|------------------------------|
| id           | uuid        | 主キー（自動生成）              |
| user_id      | uuid        | ユーザーID（auth.users参照）    |
| content      | text        | 日記本文                       |
| mood_score   | integer     | 気分スコア（1〜10）             |
| image_url    | text        | 画像URL（Supabase Storage）    |
| date         | date        | 日記の日付（ユニーク/user_id毎） |
| created_at   | timestamptz | 作成日時                       |
| updated_at   | timestamptz | 更新日時                       |

### RLS（Row Level Security）ポリシー
- ユーザーは自分の日記のみ閲覧・編集・削除可能
- `auth.uid() = user_id` で制御

### 制約
- 1ユーザーにつき1日1件まで（user_id + date でユニーク制約）

## デザイン方針
- **テーマ**: 温かみのある、落ち着いた雰囲気
- **配色**: アースカラー系（ベージュ、ウォームブラウン、オフホワイト、アクセントにテラコッタ）
- **フォント**: 読みやすい丸みのあるフォント（例: Noto Sans JP, Rounded Mplus）
- **レイアウト**: レスポンシブ対応（モバイルファースト）
- **画面構成**:
  - 左サイド or 上部: カレンダー
  - メイン: 日記投稿・閲覧エリア
  - 右サイド or 下部: 気分分析グラフ

## 開発ルール
- コードのコメントは日本語でOK
- コミットメッセージは英語（簡潔に）
- ブランチ戦略: main + feature ブランチ
- 環境変数は `.env` で管理（.gitignoreに追加）
- Supabaseの接続情報・APIキーは絶対にコミットしない

## 環境変数（.env）
```
SUPABASE_URL=（作成後に記載）
SUPABASE_ANON_KEY=（作成後に記載）
SUPABASE_SERVICE_ROLE_KEY=（作成後に記載）
DJANGO_SECRET_KEY=（生成して記載）
GOOGLE_CLIENT_ID=（Google OAuth設定後に記載）
GOOGLE_CLIENT_SECRET=（Google OAuth設定後に記載）
```
