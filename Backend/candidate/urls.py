from django.urls import path
from .views import *

urlpatterns = [
    path('register/', candidate_register),
    path('login/', candidate_login),
    path('forgot-password/', candidate_forgot_password),
    path('reset-password/', candidate_reset_password),
]
