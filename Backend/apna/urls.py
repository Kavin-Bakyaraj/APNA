from django.urls import path
from .candidate_views import *
from .hr_views import *

urlpatterns = [

    #candidate
    path('register/', candidate_register),
    path('login/', candidate_login),
    path('forgot-password/', candidate_forgot_password),
    path('reset-password/', candidate_reset_password),
    path("candidate_profile/", get_candidate_profile, name="get_candidate_profile"),
    path('get_all_jobs/', get_all_jobs),
    path("get_job_details/<str:job_id>/", get_job_details, name="get_job_details"),
    path('apply_job/', apply_for_job),
    path("check_application_status/<str:job_id>/", check_application_status, name="check_application_status"),
    path("get_applied_jobs/", get_applied_jobs),
    path("upload_resume/", upload_resume),
    path("candidate_test/", candidate_test),
    path("get_matched_jobs/", get_matched_jobs),

    #hr
    path('hr_register/', hr_register),
    path('hr_login/', hr_login),
    path('hr_forgot-password/', hr_forgot_password),
    path('hr_reset-password/', hr_reset_password),
    path("get_hr_profile/",get_hr_profile),
    path('post_job/', post_job),
    path('get_jobs/', get_jobs),
    path("get_selected_candidates/<str:job_id>/", get_selected_candidates, name="get_selected_candidates"),
    path('candidate/<str:email>', get_candidate_details, name='get_candidate_details'),
    path("delete_job/<str:job_id>/", delete_job)
]
