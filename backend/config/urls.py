from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/journals/', include('journal.urls')),
]

# 開発時: フロントエンドの静的ファイルをDjangoから配信
if settings.DEBUG:
    frontend_dir = settings.BASE_DIR.parent / 'frontend'
    urlpatterns += [
        re_path(r'^(?P<path>.+\..+)$', serve, {'document_root': frontend_dir}),
        path('', serve, {'document_root': frontend_dir, 'path': 'index.html'}),
    ]
