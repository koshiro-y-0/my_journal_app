"""
Supabase JWT認証ミドルウェア
フロントエンドから送られるSupabaseのアクセストークンを検証する
"""
import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class SupabaseUser:
    """Supabaseの認証ユーザーを表すクラス"""

    def __init__(self, user_id, email=None):
        self.id = user_id
        self.email = email
        self.is_authenticated = True


class SupabaseAuthentication(BaseAuthentication):
    """Supabase JWTトークンを検証する認証クラス"""

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split('Bearer ')[1]

        try:
            # Supabase JWTをデコード（開発時は署名検証をスキップ）
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["HS256"]
            )

            user_id = payload.get('sub')
            email = payload.get('email')

            if not user_id:
                raise AuthenticationFailed('トークンにユーザーIDが含まれていません')

            user = SupabaseUser(user_id=user_id, email=email)
            return (user, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('トークンの有効期限が切れています')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('無効なトークンです')
