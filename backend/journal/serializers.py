"""
日記データのシリアライザー
リクエストデータのバリデーションに使用
"""
from rest_framework import serializers


class JournalSerializer(serializers.Serializer):
    """日記の作成・更新時のバリデーション"""
    content = serializers.CharField(min_length=1)
    mood_score = serializers.IntegerField(min_value=1, max_value=10)
    date = serializers.DateField()
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class JournalResponseSerializer(serializers.Serializer):
    """日記のレスポンス用"""
    id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    content = serializers.CharField()
    mood_score = serializers.IntegerField()
    image_url = serializers.CharField(allow_null=True)
    date = serializers.DateField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
