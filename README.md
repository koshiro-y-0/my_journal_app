# My Journal App

自分専用の日記Webアプリケーション。1日1回その日の出来事を記録し、気分の推移を可視化できます。

## 機能

- メール/パスワードでの新規登録・ログイン
- Google OAuthログイン
- 日記の作成・編集・削除（1日1件）
- 画像の添付（Supabase Storage）
- 月別カレンダー表示（日記がある日をマーク）
- 連続投稿ストリーク表示
- 気分スコア（1〜10）の折れ線グラフ表示

## 技術スタック

- **フロントエンド**: HTML / CSS / JavaScript
- **バックエンド**: Python / Django / Django REST Framework
- **BaaS**: Supabase（PostgreSQL / Auth / Storage）
- **グラフ**: Chart.js

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/koshiro-y-0/my_journal_app.git
cd my_journal_app
```

### 2. Python仮想環境を作成・有効化

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. 依存パッケージをインストール

```bash
pip install -r backend/requirements.txt
```

### 4. 環境変数を設定

プロジェクトルートに `.env` ファイルを作成：

```
SUPABASE_URL=あなたのSupabase URL
SUPABASE_ANON_KEY=あなたのAnon Key
SUPABASE_SERVICE_ROLE_KEY=あなたのService Role Key
DJANGO_SECRET_KEY=任意のシークレットキー
DJANGO_DEBUG=True
```

### 5. フロントエンドの設定

`frontend/js/config.js` を作成：

```javascript
const SUPABASE_URL = 'あなたのSupabase URL';
const SUPABASE_ANON_KEY = 'あなたのAnon Key';
const API_BASE_URL = 'http://localhost:8000/api';
```

### 6. サーバーを起動

```bash
cd my_journal_app
source venv/bin/activate
python backend/manage.py runserver
```

### 7. ブラウザでアクセス

http://localhost:8000 を開く

## ディレクトリ構成

```
my_journal_app/
├── frontend/          # フロントエンド（HTML/CSS/JS）
│   ├── index.html     #   ログイン画面
│   ├── app.html       #   メインアプリ画面
│   ├── css/           #   スタイル
│   └── js/            #   JavaScript
├── backend/           # Djangoバックエンド
│   ├── config/        #   Django設定
│   ├── journal/       #   日記API
│   └── authentication/#   認証
├── .env               # 環境変数（Git管理外）
├── CLAUDE.md          # プロジェクト仕様書
├── TODO.md            # 開発タスク管理
└── FIX.md             # 修正履歴
```
