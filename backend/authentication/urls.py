from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.get_current_user, name='current-user'),
    path('health/', views.health_check, name='health-check'),
]
