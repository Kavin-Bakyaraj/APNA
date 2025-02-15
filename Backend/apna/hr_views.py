from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, random
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt  

# Database Connection
client = MongoClient('mongodb+srv://kavinkavin8466:kavinbox@apnaclone.bwrct.mongodb.net/')
db = client['apnaclone']
hr_collection = db['hr']
job_collection = db['job_details']  # New Collection for Job Posts
SECRET_KEY = "apna"

# Hash Password
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Check Password
def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# **Candidate Register**
from bson.objectid import ObjectId  # Import this to use ObjectId

@csrf_exempt
def hr_register(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            name = data.get("name")
            email = data.get("email")
            password = data.get("password")

            if not name or not email or not password:
                return JsonResponse({"message": "Missing required fields"}, status=400)

            # Check if HR already exists
            existing_hr = hr_collection.find_one({"email": email})
            if existing_hr:
                return JsonResponse({"message": "HR already registered"}, status=400)

            # Hash the password
            hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

            # Insert HR details into MongoDB
            hr_data = {
                "name": name,
                "email": email,
                "password": hashed_password.decode("utf-8"),
            }
            result = hr_collection.insert_one(hr_data)

            # Create a JWT token
            token = jwt.encode({"email": email, "hr_id": str(result.inserted_id)}, SECRET_KEY, algorithm="HS256")

            return JsonResponse({"message": "HR registered successfully", "token": token}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON data"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

# **HR Login**
@csrf_exempt
def hr_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return JsonResponse({"message": "Missing email or password"}, status=400)

            # Find HR by email
            hr = hr_collection.find_one({"email": email})

            if not hr:
                return JsonResponse({"message": "HR not found"}, status=404)

            # Verify the password
            if not bcrypt.checkpw(password.encode("utf-8"), hr["password"].encode("utf-8")):
                return JsonResponse({"message": "Incorrect password"}, status=401)

            # Generate JWT token
            token = jwt.encode({"email": email, "hr_id": str(hr["_id"])}, SECRET_KEY, algorithm="HS256")

            return JsonResponse({"message": "Login successful", "token": token}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON data"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)


# **HR Forgot Password**
@csrf_exempt
def hr_forgot_password(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user = hr_collection.find_one({"email": data["email"]})
            if not user:
                return JsonResponse({"message": "Email not found"}, status=404)

            otp = random.randint(100000, 999999)
            hr_collection.update_one({"email": data["email"]}, {"$set": {"otp": otp, "otp_expiry": datetime.utcnow() + timedelta(minutes=10)}})
            return JsonResponse({"message": "OTP sent to email", "otp": otp})
        
        except Exception as e:
            return JsonResponse({"message": "Error", "error": str(e)}, status=500)

# **HR Reset Password**
@csrf_exempt
def hr_reset_password(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            otp = data.get("otp")
            new_password = data.get("new_password")

            if not email or not otp or not new_password:
                return JsonResponse({"message": "Missing required fields"}, status=400)

            # Find user with matching OTP
            user = hr_collection.find_one({"email": email})

            if not user:
                return JsonResponse({"message": "Email not found"}, status=404)

            # Check if OTP is valid and not expired
            if user.get("otp") != otp:
                return JsonResponse({"message": "Invalid OTP"}, status=400)

            if user.get("otp_expiry") and datetime.utcnow() > user["otp_expiry"]:
                return JsonResponse({"message": "OTP expired"}, status=400)

            # Hash new password before storing
            hashed_password = hash_password(new_password)

            # Update password and remove OTP from database
            hr_collection.update_one(
                {"email": email},
                {"$set": {"password": hashed_password, "otp": None, "otp_expiry": None}}
            )

            return JsonResponse({"message": "Password reset successful"})

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=400)

        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)


# **HR Post Job**
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from bson.objectid import ObjectId

@csrf_exempt
def post_job(request):
    if request.method == "POST":
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return JsonResponse({"message": "Authorization token missing"}, status=401)

            # Decode JWT token
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                hr_id = decoded_token.get("hr_id")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Read JSON request body
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"message": "Invalid JSON format"}, status=400)

            # Extract fields
            job_title = data.get("job_title")
            job_description = data.get("job_description")
            skills_required = data.get("skills_required")
            salary = data.get("salary")
            experience = data.get("experience")
            pass_percentage = data.get("pass_percentage")  # Removed default value
            hr_questions = data.get("hr_questions", [])

            # Validate required fields
            if not all([job_title, job_description, skills_required, salary, experience]):
                return JsonResponse({"message": "Missing job details"}, status=400)

            # Validate pass percentage (HR must provide it)
            if pass_percentage is None or not (0 <= pass_percentage <= 100):
                return JsonResponse({"message": "Pass percentage must be between 0 and 100"}, status=400)

            # Validate questions
            if len(hr_questions) < 5:
                return JsonResponse({"message": "At least 5 questions are required"}, status=400)

            for question in hr_questions:
                if not all(key in question for key in ["question", "keyword"]):
                    return JsonResponse({"message": "Each question must have 'question' and 'keyword'"}, status=400)

            # Insert into MongoDB
            job_data = {
                "hr_id": ObjectId(hr_id),
                "job_title": job_title,
                "job_description": job_description,
                "skills_required": skills_required,
                "salary": salary,
                "experience": experience,
                "pass_percentage": pass_percentage,  # Ensure it's set
                "hr_questions": hr_questions,
                "selected_candidates": []
            }
            job_collection.insert_one(job_data)

            return JsonResponse({"message": "Job posted successfully"}, status=201)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)


from bson import ObjectId

@csrf_exempt
def get_jobs(request):
    if request.method == "GET":
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return JsonResponse({"message": "Authorization token missing"}, status=401)

            # Decode JWT token
            try:
                token = auth_header.split(" ")[1]
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                hr_id = decoded_token.get("hr_id")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Fetch jobs for this HR
            jobs = list(job_collection.find({"hr_id": ObjectId(hr_id)}))

            if not jobs:
                return JsonResponse({"message": "No jobs found for this HR"}, status=404)

            # Convert ObjectId to string
            for job in jobs:
                job["_id"] = str(job["_id"])
                job["hr_id"] = str(job["hr_id"])

            return JsonResponse({"jobs": jobs}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def get_selected_candidates(request, job_id):
    if request.method == "GET":
        try:
            job = job_collection.find_one({"_id": ObjectId(job_id)})
            if not job:
                return JsonResponse({"message": "Job not found"}, status=404)

            selected_candidates = job.get("selected_candidates", [])

            return JsonResponse({"selected_candidates": selected_candidates}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)


from bson import ObjectId
import jwt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def delete_job(request, job_id):  # Accept job_id from the URL
    if request.method == "DELETE":
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return JsonResponse({"message": "Authorization token missing"}, status=401)

            # Decode JWT token
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                hr_id = decoded_token.get("hr_id")  # Extract HR ID from token
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Verify job existence and ownership
            job = job_collection.find_one({"_id": ObjectId(job_id)})
            if not job:
                return JsonResponse({"message": "Job not found"}, status=404)

            if str(job.get("hr_id")) != str(hr_id):  # Ensure only the HR who created it can delete
                return JsonResponse({"message": "Unauthorized: You can only delete your own job postings"}, status=403)

            # Delete job from MongoDB
            job_collection.delete_one({"_id": ObjectId(job_id)})

            return JsonResponse({"message": "Job deleted successfully"}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)
