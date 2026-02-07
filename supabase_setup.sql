-- ============================================
-- My Journal App - Supabase テーブル設定
-- ============================================
-- このSQLをSupabaseのSQL Editorで実行してください

-- journalsテーブルの作成
CREATE TABLE journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
    image_url TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 1ユーザーにつき1日1件まで
    UNIQUE(user_id, date)
);

-- インデックスの作成
CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_date ON journals(date);
CREATE INDEX idx_journals_user_date ON journals(user_id, date);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS（Row Level Security）の設定
-- ============================================
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分の日記のみ閲覧可能
CREATE POLICY "Users can view own journals"
    ON journals FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: 自分のuser_idでのみ作成可能
CREATE POLICY "Users can insert own journals"
    ON journals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 自分の日記のみ編集可能
CREATE POLICY "Users can update own journals"
    ON journals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: 自分の日記のみ削除可能
CREATE POLICY "Users can delete own journals"
    ON journals FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Storageバケットの設定
-- ============================================
-- ※ Storageバケットの作成はSupabaseダッシュボードから手動で行ってください
-- バケット名: journal-images
-- Public: false（非公開）
--
-- 以下のRLSポリシーをStorage > Policiesで設定:
-- SELECT: auth.uid()::text = (storage.foldername(name))[1]
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- DELETE: auth.uid()::text = (storage.foldername(name))[1]
