from django.urls import path
from . import views

urlpatterns = [
    # 日記一覧取得・作成
    path('', views.journal_list_create, name='journal-list-create'),
    # 日記詳細・編集・削除
    path('<uuid:journal_id>/', views.journal_detail, name='journal-detail'),
    # 画像アップロード
    path('upload-image/', views.image_upload, name='image-upload'),
    # 気分統計
    path('mood-stats/', views.mood_stats, name='mood-stats'),
]
