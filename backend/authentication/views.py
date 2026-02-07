"""
認証関連のビュー
Supabase Authがメインの認証を担当するため、
Django側はトークン検証とユーザー情報の返却のみ行う
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """現在ログイン中のユーザー情報を返す"""
    return Response({
        'user_id': request.user.id,
        'email': request.user.email,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """APIの稼働確認用エンドポイント"""
    return Response({'status': 'ok'})
