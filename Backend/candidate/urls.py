from django.urls import path
from .views import *

urlpatterns = [
    path('register/', candidate_register),
    path('login/', candidate_login),
    path('forgot-password/', candidate_forgot_password),
    path('reset-password/', candidate_reset_password),
    path('get_all_jobs/', get_all_jobs),
    path('apply_job/', apply_for_job),
    path("get_job_details/<str:job_id>/", get_job_details, name="get_job_details"),
]
