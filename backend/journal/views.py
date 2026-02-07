"""
日記CRUD APIビュー
Supabase PostgreSQLに対してCRUD操作を行う
"""
import uuid
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from .serializers import JournalSerializer
from .supabase_client import get_supabase_client


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def journal_list_create(request):
    """
    GET: 日記一覧取得（月別フィルタ対応）
    POST: 日記作成（1日1件チェック）
    """
    supabase = get_supabase_client()
    user_id = request.user.id

    if request.method == 'GET':
        return _get_journals(supabase, user_id, request)
    else:
        return _create_journal(supabase, user_id, request)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def journal_detail(request, journal_id):
    """
    GET: 日記詳細取得
    PUT: 日記編集
    DELETE: 日記削除
    """
    supabase = get_supabase_client()
    user_id = request.user.id

    if request.method == 'GET':
        return _get_journal_detail(supabase, user_id, journal_id)
    elif request.method == 'PUT':
        return _update_journal(supabase, user_id, journal_id, request)
    else:
        return _delete_journal(supabase, user_id, journal_id)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def image_upload(request):
    """画像をSupabase Storageにアップロード"""
    supabase = get_supabase_client()
    user_id = request.user.id

    if 'image' not in request.FILES:
        return Response({'error': '画像ファイルが必要です'}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.FILES['image']

    # ファイルサイズチェック（5MB制限）
    if image_file.size > 5 * 1024 * 1024:
        return Response({'error': '画像は5MB以下にしてください'}, status=status.HTTP_400_BAD_REQUEST)

    # ファイル形式チェック
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if image_file.content_type not in allowed_types:
        return Response({'error': 'JPEG、PNG、GIF、WebP形式のみ対応しています'}, status=status.HTTP_400_BAD_REQUEST)

    # ユニークなファイル名を生成（user_id/uuid.拡張子）
    ext = image_file.name.split('.')[-1] if '.' in image_file.name else 'jpg'
    file_name = f"{user_id}/{uuid.uuid4()}.{ext}"

    try:
        # Supabase Storageにアップロード
        file_bytes = image_file.read()
        supabase.storage.from_('journal-images').upload(
            file_name,
            file_bytes,
            {'content-type': image_file.content_type}
        )

        # 署名付きURLを取得（1年有効）
        signed_url = supabase.storage.from_('journal-images').create_signed_url(
            file_name, 60 * 60 * 24 * 365
        )

        return Response({
            'image_url': signed_url['signedURL'],
            'file_path': file_name,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': f'アップロードに失敗しました: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mood_stats(request):
    """月別の気分スコアデータを取得"""
    supabase = get_supabase_client()
    user_id = request.user.id
    month = request.query_params.get('month')  # YYYY-MM形式

    if not month:
        return Response({'error': 'monthパラメータが必要です（YYYY-MM形式）'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 月の開始日と終了日を計算
        year, mon = month.split('-')
        start_date = f"{year}-{mon}-01"
        # 月末日を計算
        if int(mon) == 12:
            end_date = f"{int(year)+1}-01-01"
        else:
            end_date = f"{year}-{int(mon)+1:02d}-01"

        result = supabase.table('journals') \
            .select('date, mood_score') \
            .eq('user_id', user_id) \
            .gte('date', start_date) \
            .lt('date', end_date) \
            .order('date') \
            .execute()

        # 月平均を計算
        scores = [entry['mood_score'] for entry in result.data]
        average = sum(scores) / len(scores) if scores else 0

        return Response({
            'month': month,
            'data': result.data,
            'average': round(average, 1),
            'count': len(scores),
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === プライベート関数 ===

def _get_journals(supabase, user_id, request):
    """日記一覧を取得（月別フィルタ対応）"""
    try:
        query = supabase.table('journals') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('date', desc=True)

        # 月別フィルタ
        month = request.query_params.get('month')
        if month:
            year, mon = month.split('-')
            start_date = f"{year}-{mon}-01"
            if int(mon) == 12:
                end_date = f"{int(year)+1}-01-01"
            else:
                end_date = f"{year}-{int(mon)+1:02d}-01"
            query = query.gte('date', start_date).lt('date', end_date)

        result = query.execute()
        return Response(result.data)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _create_journal(supabase, user_id, request):
    """日記を作成（1日1件チェック付き）"""
    serializer = JournalSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    journal_date = str(data['date'])

    try:
        # 同じ日付の日記が既にあるかチェック
        existing = supabase.table('journals') \
            .select('id') \
            .eq('user_id', user_id) \
            .eq('date', journal_date) \
            .execute()

        if existing.data:
            return Response(
                {'error': 'この日付の日記は既に存在します。編集してください。'},
                status=status.HTTP_409_CONFLICT
            )

        # 日記を作成
        new_journal = {
            'user_id': user_id,
            'content': data['content'],
            'mood_score': data['mood_score'],
            'date': journal_date,
            'image_url': data.get('image_url'),
        }

        result = supabase.table('journals').insert(new_journal).execute()
        return Response(result.data[0], status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _get_journal_detail(supabase, user_id, journal_id):
    """日記詳細を取得"""
    try:
        result = supabase.table('journals') \
            .select('*') \
            .eq('id', journal_id) \
            .eq('user_id', user_id) \
            .execute()

        if not result.data:
            return Response({'error': '日記が見つかりません'}, status=status.HTTP_404_NOT_FOUND)

        return Response(result.data[0])

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _update_journal(supabase, user_id, journal_id, request):
    """日記を更新"""
    serializer = JournalSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    try:
        # 自分の日記かチェック
        existing = supabase.table('journals') \
            .select('id') \
            .eq('id', journal_id) \
            .eq('user_id', user_id) \
            .execute()

        if not existing.data:
            return Response({'error': '日記が見つかりません'}, status=status.HTTP_404_NOT_FOUND)

        # 更新
        update_data = {
            'content': data['content'],
            'mood_score': data['mood_score'],
            'date': str(data['date']),
            'image_url': data.get('image_url'),
        }

        result = supabase.table('journals') \
            .update(update_data) \
            .eq('id', journal_id) \
            .eq('user_id', user_id) \
            .execute()

        return Response(result.data[0])

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _delete_journal(supabase, user_id, journal_id):
    """日記を削除"""
    try:
        # 自分の日記かチェック
        existing = supabase.table('journals') \
            .select('id, image_url') \
            .eq('id', journal_id) \
            .eq('user_id', user_id) \
            .execute()

        if not existing.data:
            return Response({'error': '日記が見つかりません'}, status=status.HTTP_404_NOT_FOUND)

        # 画像があればStorageからも削除
        image_url = existing.data[0].get('image_url')
        if image_url and 'journal-images' in image_url:
            try:
                # URLからファイルパスを抽出
                file_path = f"{user_id}/" + image_url.split(f"{user_id}/")[-1].split('?')[0]
                supabase.storage.from_('journal-images').remove([file_path])
            except Exception:
                pass  # 画像削除に失敗しても日記は削除する

        # 日記を削除
        supabase.table('journals') \
            .delete() \
            .eq('id', journal_id) \
            .eq('user_id', user_id) \
            .execute()

        return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
