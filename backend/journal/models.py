"""
日記モデル定義
DjangoのORMは使わず、Supabase PostgreSQLに直接アクセスする。
このモデルは参照用の定義として残す。
"""


# Supabase DBと対応するデータ構造（参照用）
# 実際のDB操作はviews.pyでSupabaseクライアントを通じて行う
#
# journals テーブル:
#   id: UUID (主キー, 自動生成)
#   user_id: UUID (auth.users参照)
#   content: TEXT (日記本文)
#   mood_score: INTEGER (1〜10)
#   image_url: TEXT (画像URL, nullable)
#   date: DATE (日記の日付, user_id + date でユニーク)
#   created_at: TIMESTAMPTZ
#   updated_at: TIMESTAMPTZ
