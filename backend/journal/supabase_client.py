"""
Supabaseクライアント初期化
"""
from django.conf import settings
from supabase import create_client


def get_supabase_client():
    """サービスロールキーでSupabaseクライアントを取得（サーバーサイド用）"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_supabase_anon_client():
    """Anonキーでクライアントを取得"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
