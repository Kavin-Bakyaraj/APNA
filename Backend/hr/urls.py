from django.urls import path
from .views import *

urlpatterns = [
    path('register/', hr_register),
    path('login/', hr_login),
    path('forgot-password/', hr_forgot_password),
    path('reset-password/', hr_reset_password),
    path('post_job/', post_job),
    path('get_jobs/', get_jobs),
    path("get_selected_candidates/<str:job_id>/", get_selected_candidates, name="get_selected_candidates"),
]
