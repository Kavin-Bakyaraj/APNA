from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, random
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt  

# MongoDB Connection
client = MongoClient('mongodb+srv://kavinkavin8466:kavinbox@apnaclone.bwrct.mongodb.net/')
db = client['apnaclone']
candidate_collection = db['candidate']
hr_collection = db['hr']
job_collection = db['job_details']  # Ensure you have a 'jobs' collection

# Secret Key for JWT
SECRET_KEY = "apna"

# Helper Function: Hash Password
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Helper Function: Verify Password
def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

@csrf_exempt
def candidate_register(request):
    if request.method == "POST":
        data = json.loads(request.body)
        existing_user = candidate_collection.find_one({"email": data["email"]})
        if existing_user:
            return JsonResponse({"message": "Email already registered"}, status=400)
        
        hashed_password = hash_password(data["password"])  
        candidate_collection.insert_one({
            "name": data["name"],
            "email": data["email"],
            "password": hashed_password,
            "otp": None,
            "otp_expiry": None
        })
        return JsonResponse({"message": "Candidate registered successfully"})

@csrf_exempt
def candidate_login(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user = candidate_collection.find_one({"email": data["email"]})
        if not user or not check_password(data["password"], user["password"]):
            return JsonResponse({"message": "Invalid credentials"}, status=401)

        token = jwt.encode({"email": user["email"], "exp": datetime.utcnow() + timedelta(hours=1)}, SECRET_KEY, algorithm="HS256")
        return JsonResponse({"token": token})

@csrf_exempt
def candidate_forgot_password(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user = candidate_collection.find_one({"email": data["email"]})
        if not user:
            return JsonResponse({"message": "Email not found"}, status=404)

        otp = random.randint(100000, 999999)
        otp_expiry = datetime.utcnow() + timedelta(minutes=10)  
        candidate_collection.update_one({"email": data["email"]}, {"$set": {"otp": otp, "otp_expiry": otp_expiry}})
        return JsonResponse({"message": "OTP sent to email", "otp": otp})  # Replace with email sending in production

@csrf_exempt
def candidate_reset_password(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user = candidate_collection.find_one({"email": data["email"], "otp": data["otp"]})
        if not user:
            return JsonResponse({"message": "Invalid OTP"}, status=400)
        
        if datetime.utcnow() > user["otp_expiry"]:
            return JsonResponse({"message": "OTP expired"}, status=400)

        hashed_password = hash_password(data["new_password"])
        candidate_collection.update_one({"email": data["email"]}, {"$set": {"password": hashed_password, "otp": None, "otp_expiry": None}})
        return JsonResponse({"message": "Password reset successful"})
from bson import ObjectId  # Import ObjectId

from bson import ObjectId  # Import ObjectId

@csrf_exempt
def get_all_jobs(request):
    if request.method == "GET":
        try:
            jobs = list(job_collection.find({}))  # Fetch all jobs
            job_list = []

            for job in jobs:
                hr_name = "Unknown HR"
                hr_email = "No Email"

                # Check if "hr_id" exists in the job document
                if "hr_id" in job and job["hr_id"]:
                    try:
                        hr_details = hr_collection.find_one({"_id": ObjectId(job["hr_id"])})
                        if hr_details:
                            hr_name = hr_details.get("name", "Unknown HR")
                            hr_email = hr_details.get("email", "No Email")
                    except Exception as e:
                        print(f"Error fetching HR details: {e}")

                job_data = {
                    "job_id": str(job["_id"]),
                    "job_title": job.get("job_title", "No Title"),
                    "job_description": job.get("job_description", "No Description"),
                    "skills_required": job.get("skills_required", []),
                    "salary": job.get("salary", "Not Specified"),
                    "experience": job.get("experience", "Not Specified"),
                    "hr_name": hr_name,  # Include HR details
                    "hr_email": hr_email
                }
                job_list.append(job_data)

            return JsonResponse({"jobs": job_list}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)



@csrf_exempt
def apply_for_job(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            job_id = data["job_id"]
            candidate_email = data["candidate_email"]
            answers = data["answers"]  # Dictionary { "question": "candidate_answer" }

            # Fetch job details
            job = job_collection.find_one({"_id": ObjectId(job_id)})
            if not job:
                return JsonResponse({"message": "Job not found"}, status=404)

            hr_questions = job.get("hr_questions", [])  # Fetch HR's questions
            pass_percentage = job.get("pass_percentage", 50)  # Get HR-set pass percentage (default 50%)

            # Ensure pass_percentage exists
            if pass_percentage is None or not (0 <= pass_percentage <= 100):
                return JsonResponse({"message": "Invalid pass percentage in job details"}, status=400)

            # Evaluation
            total_questions = len(hr_questions)
            correct_answers = 0

            for question in hr_questions:
                q_text = question["question"]
                keyword = question["keyword"].lower()
                candidate_answer = answers.get(q_text, "").lower()

                if keyword in candidate_answer:  # Check if keyword is present
                    correct_answers += 1

            # Calculate percentage
            score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            passed = score >= pass_percentage

            # If passed, store candidate details in the job post
            if passed:
                candidate_details = candidate_collection.find_one({"email": candidate_email})
                if candidate_details:
                    candidate_profile = {
                        "candidate_id": str(candidate_details["_id"]),
                        "name": candidate_details["name"],
                        "email": candidate_details["email"],
                        "score": score
                    }
                    job_collection.update_one({"_id": ObjectId(job_id)}, {"$push": {"selected_candidates": candidate_profile}})

            return JsonResponse({
                "message": "Test submitted",
                "score": score,
                "passed": passed
            })

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)


@csrf_exempt
def get_job_details(request, job_id):
    if request.method == "GET":
        job = job_collection.find_one({"_id": ObjectId(job_id)})
        if not job:
            return JsonResponse({"message": "Job not found"}, status=404)

        job_info = {
            "job_title": job["job_title"],
            "job_description": job["job_description"],
            "skills_required": job["skills_required"],
            "salary": job["salary"],
            "experience": job["experience"],
            "pass_percentage": job["pass_percentage"],
            "hr_questions": [{"question": q["question"]} for q in job["hr_questions"]]  # Show only questions, not keywords
        }

        return JsonResponse(job_info)

    return JsonResponse({"message": "Invalid request method"}, status=405)
