from django.urls import path
from .views import *

urlpatterns = [
    path('register/', hr_register),
    path('login/', hr_login),
    path('forgot-password/', hr_forgot_password),
    path('reset-password/', hr_reset_password),
]
