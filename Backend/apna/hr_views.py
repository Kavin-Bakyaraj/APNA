from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, random
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt 
from django.utils.decorators import method_decorator
from bson.objectid import ObjectId
import urllib.parse

# Database Connection
client = MongoClient('mongodb+srv://kavinkavin8466:kavinbox@apnaclone.bwrct.mongodb.net/')
db = client['apnaclone']
hr_collection = db['hr']
candidate_collection = db['candidate']
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

            # Find user with matching email
            user = hr_collection.find_one({"email": email})

            if not user:
                return JsonResponse({"message": "Email not found"}, status=404)

            # Ensure OTP is compared as strings
            if str(user.get("otp")) != str(otp):
                return JsonResponse({"message": "Invalid OTP"}, status=400)

            # Check if OTP is expired
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

            # Extract and validate new fields
            job_title = data.get("job_title", "").strip()
            company_name = data.get("company_name", "").strip()
            job_description = data.get("job_description", "").strip()
            contact_email = data.get("contact_email", "").strip()
            application_deadline = data.get("application_deadline", "").strip()
            work_type = data.get("selectedWorkType", "").strip()  # Work type
            job_location = data.get("job_location", "").strip()
            category = data.get("selectedCategory", "").strip()  # Category
            skills_required = data.get("skills_required", "").strip()
            salary = data.get("salary")
            experience = data.get("experience")
            pass_percentage = data.get("pass_percentage")
            hr_questions = data.get("hr_questions", [])

            # Validate required fields
            if not all([
                job_title, company_name, job_description, contact_email, 
                application_deadline, work_type, job_location, category,
                skills_required, salary, experience
            ]):
                return JsonResponse({"message": "Missing job details"}, status=400)

            # Convert numerical values properly
            try:
                salary = int(salary)
                experience = int(experience)
                pass_percentage = int(pass_percentage)
            except ValueError:
                return JsonResponse({"message": "Salary, Experience, and Pass Percentage must be numbers"}, status=400)

            # Validate pass percentage range
            if pass_percentage < 0 or pass_percentage > 100:
                return JsonResponse({"message": "Pass percentage must be between 0 and 100"}, status=400)

            # Validate HR questions
            if not isinstance(hr_questions, list) or len(hr_questions) < 2 or len(hr_questions) > 5:
                return JsonResponse({"message": "HR questions must be between 2 and 5"}, status=400)

            for question in hr_questions:
                if not isinstance(question, dict) or not all(key in question for key in ["question", "keyword"]):
                    return JsonResponse({"message": "Each question must have 'question' and 'keyword'"}, status=400)

            # Insert into MongoDB with the new fields
            job_data = {
                "hr_id": ObjectId(hr_id),
                "job_title": job_title,
                "company_name": company_name,
                "job_description": job_description,
                "contact_email": contact_email,
                "application_deadline": application_deadline,
                "work_type": work_type,
                "job_location": job_location,
                "category": category,
                "skills_required": skills_required,
                "salary": salary,
                "experience": experience,
                "pass_percentage": pass_percentage,
                "hr_questions": hr_questions,
                "selected_candidates": [],
                "applied_candidates": []  # Store candidates who apply but have not taken the test
            }
            job_collection.insert_one(job_data)

            return JsonResponse({"message": "Job posted successfully"}, status=201)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

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

@csrf_exempt
def get_candidate_details(request, email):
    if request.method == "GET":
        try:
            # Verify token
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return JsonResponse({"message": "Authorization token missing"}, status=401)

            try:
                token = auth_header.split(" ")[1]
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                hr_id = decoded_token.get("hr_id")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Decode URL-encoded email
            decoded_email = urllib.parse.unquote(email)

            # Fetch candidate from database (case-insensitive lookup)
            candidate = candidate_collection.find_one({"email": {"$regex": f"^{decoded_email}$", "$options": "i"}})

            if not candidate:
                return JsonResponse({"message": "Candidate not found"}, status=404)

            # Convert ObjectId to string for JSON serialization
            candidate['_id'] = str(candidate['_id'])

            return JsonResponse(candidate, safe=False)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def get_hr_profile(request):
    if request.method == "GET":
        try:
            # Extract JWT token from headers
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Token is missing"}, status=401)

            token = auth_header.split(" ")[1]  # Extract token

            try:
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                email = decoded_token.get("email")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token has expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Fetch HR details from MongoDB
            hr = hr_collection.find_one({"email": email})
            if not hr:
                return JsonResponse({"message": "HR profile not found"}, status=404)

            # Convert ObjectId to string for serialization
            hr["_id"] = str(hr["_id"])

            return JsonResponse(hr, safe=False)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)