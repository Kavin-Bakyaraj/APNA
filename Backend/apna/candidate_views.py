from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, random
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt  
import google.generativeai as genai
from django.core.files.storage import default_storage
import re
from bson import ObjectId

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
        try:
            data = json.loads(request.body)
            email = data.get("email")
            otp = data.get("otp")
            new_password = data.get("new_password")

            if not email or not otp or not new_password:
                return JsonResponse({"message": "Missing required fields"}, status=400)

            # Find user with matching email
            user = candidate_collection.find_one({"email": email})

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
            answers = data["answers"]

            # Fetch job details
            job = job_collection.find_one({"_id": ObjectId(job_id)})
            if not job:
                return JsonResponse({"message": "Job not found"}, status=404)

            pass_percentage = job.get("pass_percentage", 50)
            hr_questions = job.get("hr_questions", [])

            if pass_percentage is None or not (0 <= pass_percentage <= 100):
                return JsonResponse({"message": "Invalid pass percentage in job details"}, status=400)

            # Check if candidate already applied
            existing_candidate = next(
                (c for c in job.get("applied_candidates", []) if c["email"] == candidate_email),
                None
            )

            if existing_candidate:
                if existing_candidate["test_status"] == "failed":
                    return JsonResponse({"message": "You have already failed this test and cannot reapply"}, status=403)
                elif existing_candidate["test_status"] == "passed":
                    return JsonResponse({"message": "You have already passed and applied for this job"}, status=200)

            # Evaluation logic
            total_questions = len(hr_questions)
            correct_answers = 0
            debug_logs = []

            def keyword_match(keywords, answer):
                """
                Function to check multiple keywords in an answer
                Returns the fraction of keywords matched (0 to 1)
                """
                if isinstance(keywords, str):
                    keywords = [keywords]  # Convert single keyword to list
                
                keywords = [k.strip().lower() for k in keywords]
                answer = answer.lower()
                
                matched_keywords = 0
                for keyword in keywords:
                    if bool(re.search(r"\b" + re.escape(keyword) + r"\b", answer, re.IGNORECASE)) or (keyword in answer):
                        matched_keywords += 1
                
                return matched_keywords / len(keywords) if keywords else 0

            for question in hr_questions:
                q_text = question["question"]
                keywords = question["keyword"]  # This can be either a string or a list of keywords
                candidate_answer = answers.get(q_text, "").strip()

                # Convert string keyword to list if necessary
                if isinstance(keywords, str):
                    keywords = [keyword.strip() for keyword in keywords.split(',')]
                elif isinstance(keywords, list):
                    keywords = [k.strip() for k in keywords]
                else:
                    keywords = [str(keywords).strip()]

                # Calculate partial credit
                match_score = keyword_match(keywords, candidate_answer)
                correct_answers += match_score

                # Add logs for debugging
                debug_logs.append({
                    "question": q_text,
                    "expected_keywords": keywords,
                    "candidate_answer": candidate_answer,
                    "match_score": match_score,
                    "matched_percentage": f"{match_score * 100}%"
                })

            # Calculate percentage
            score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            passed = score >= pass_percentage
            test_status = "passed" if passed else "failed"

            # Store application status
            candidate_details = candidate_collection.find_one({"email": candidate_email})
            if candidate_details:
                candidate_profile = {
                    "candidate_id": str(candidate_details["_id"]),
                    "name": candidate_details["name"],
                    "email": candidate_details["email"],
                    "score": round(score, 2),  # Round to 2 decimal places
                    "test_status": test_status
                }

                # Update the job document with applied candidate details
                job_collection.update_one(
                    {"_id": ObjectId(job_id)},
                    {"$push": {"applied_candidates": candidate_profile}}
                )

                # If passed, also add to selected_candidates
                if passed:
                    job_collection.update_one(
                        {"_id": ObjectId(job_id)},
                        {"$push": {"selected_candidates": candidate_profile}}
                    )

            return JsonResponse({
                "message": "Test submitted",
                "score": round(score, 2),
                "passed": passed,
                "test_status": test_status,
                "debug_logs": debug_logs
            })

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def get_job_details(request, job_id):
    if request.method == "GET":
        try:
            # Extract token from request
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Authorization token missing"}, status=401)

            token = auth_header.split(" ")[1]  # Extract token
            try:
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                candidate_email = decoded_token.get("email")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Fetch job details
            job = job_collection.find_one({"_id": ObjectId(job_id)})
            if not job:
                return JsonResponse({"message": "Job not found"}, status=404)

            # Check if the candidate has applied before
            applied_candidate = next(
                (c for c in job.get("applied_candidates", []) if c["email"] == candidate_email),
                None
            )

            # Determine test status
            test_status = applied_candidate["test_status"] if applied_candidate else "not_attempted"

            # Helper function to handle missing values
            def get_value(field, default="N/A"):
                return job.get(field, default) if job.get(field) not in [None, "", []] else default

            # Prepare job details response
            job_info = {
                "job_title": get_value("job_title"),
                "company_name": get_value("company_name"),
                "job_description": get_value("job_description"),
                "contact_email": get_value("contact_email"),
                "application_deadline": get_value("application_deadline"),
                "work_type": get_value("work_type"),
                "job_location": get_value("job_location"),
                "category": get_value("category"),
                "skills_required": get_value("skills_required"),
                "salary": get_value("salary"),
                "experience": get_value("experience"),
                "pass_percentage": get_value("pass_percentage"),
                "hr_questions": [
                    {"question": q["question"]} for q in job.get("hr_questions", [])
                ] if job.get("hr_questions") else [{"question": "N/A"}],  # Ensures at least "N/A" if empty
                "selected_candidates": job.get("selected_candidates", []),
                "applied_candidates": job.get("applied_candidates", []),
                "test_status": test_status  # New field to indicate the test status
            }

            return JsonResponse(job_info, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def get_applied_jobs(request):
    if request.method == "GET":
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return JsonResponse({"message": "Authorization token missing"}, status=401)

            # Decode JWT token
            try:
                token = auth_header.split(" ")[1]  # Extract token from 'Bearer <token>'
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                candidate_email = decoded_token.get("email")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Find all jobs where the candidate has applied
            applied_jobs = job_collection.find(
                {"selected_candidates.email": candidate_email},
                {"_id": 1, "job_title": 1, "job_description": 1, "skills_required": 1, "salary": 1, "experience": 1}
            )

            # Convert query result to a list
            jobs_list = []
            for job in applied_jobs:
                jobs_list.append({
                    "job_id": str(job["_id"]),
                    "job_title": job["job_title"],
                    "job_description": job["job_description"],
                    "skills_required": job["skills_required"],
                    "salary": job["salary"],
                    "experience": job["experience"]
                })

            return JsonResponse({"applied_jobs": jobs_list}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

genai.configure(api_key="AIzaSyBZ2_kNMN0cK81n9iSaEPEXFUDir4Sax8Q")

import os
import fitz  # PyMuPDF for PDF text extraction
import pytesseract
import google.generativeai as genai
from PIL import Image
import re
TOKEN_LIMIT = 30720  # Gemini AI's max token limit

# Windows users: Uncomment and set the correct Tesseract path if needed
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

@csrf_exempt
def upload_resume(request):
    if request.method == "POST":
        try:
            # **🔹 Extract token from Authorization header**
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Token is missing"}, status=401)

            token = auth_header.split(" ")[1]  # Extract the actual token

            try:
                # **🔹 Decode JWT to get user email**
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                email = decoded_token.get("email")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token has expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # **🔹 Extract resume file**
            resume_file = request.FILES.get("resume")
            if not resume_file:
                return JsonResponse({"message": "Resume file is required"}, status=400)

            # **🔹 Define and create the upload directory**
            upload_dir = os.path.join("uploads", email)
            os.makedirs(upload_dir, exist_ok=True)

            # **🔹 Save the resume file**
            resume_path = os.path.join(upload_dir, resume_file.name)
            with open(resume_path, "wb+") as destination:
                for chunk in resume_file.chunks():
                    destination.write(chunk)

            # **🔹 Extract text from resume**
            doc = fitz.open(resume_path)  # Open the PDF
            resume_text = ""

            for page in doc:
                resume_text += page.get_text("text")  # Try direct text extraction

            if not resume_text.strip():  # If no text, use OCR
                for page_num in range(len(doc)):
                    pix = doc[page_num].get_pixmap()
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    resume_text += pytesseract.image_to_string(img, lang="eng")  # OCR Processing

            if not resume_text.strip():
                return JsonResponse({"message": "Resume file is empty or unreadable"}, status=400)

            # **🔹 Trim the resume text to stay within Gemini's token limit**
            words = resume_text.split()  # Split into words
            trimmed_resume_text = " ".join(words[:TOKEN_LIMIT // 2])  # Keep it safe under the limit

            # **🔹 Generate questions and extract skills using Gemini AI**
            prompt = f"""
            You are an AI that extracts skills, work experience, and projects from a resume.
            Analyze the following resume and generate 10 scenario-based questions for the candidate based on their experience.
            Give new questions to each candidates and each resumes, dont give the keyword directly as same in the question.
            Give atleast two keywords for each question.
            

            Resume Text:
            {trimmed_resume_text}

            Provide the response in JSON format:
            {{
                "skills": ["skill1", "skill2", ...],
                "work_experience": ["Company1 - Role1", "Company2 - Role2", ...],
                "projects": ["Project1", "Project2", ...],
                "questions": [
                    {{"question": "Scenario-based question 1", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 2", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 3", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 4", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 5", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 6", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 7", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 8", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 9", "keyword": "expected_answer_keyword"}},
                    {{"question": "Scenario-based question 10", "keyword": "expected_answer_keyword"}}
                ]
            }}
            """

            # **🔹 Call Gemini AI**
            model = genai.GenerativeModel("gemini-pro")
            response = model.generate_content(prompt)

            # **🔹 Ensure response is valid JSON**
            if response and response.text:
                try:
                    cleaned_response = re.sub(r"```json|```", "", response.text).strip()

# Now parse the valid JSON
                    result = json.loads(cleaned_response)
                except json.JSONDecodeError:
                    return JsonResponse({"message": "Invalid JSON response from Gemini", "error": response.text}, status=500)
            else:
                return JsonResponse({"message": "Empty response from Gemini"}, status=500)

            # **🔹 Save extracted details in MongoDB**
            candidate_collection.update_one(
                {"email": email},
                {"$set": {
                    "resume_skills": result.get("skills", []),
                    "work_experience": result.get("work_experience", []),
                    "projects": result.get("projects", []),
                    "generated_questions": result.get("questions", []),
                    "profile_status": "Pending"
                }},
                upsert=True
            )

            return JsonResponse({"message": "Resume analyzed successfully", "data": result}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Error processing resume", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)


import jwt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def get_candidate_test_status(request, job_id):
    if request.method == "GET":
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return JsonResponse({"message": "Authorization token missing"}, status=401)

            # Decode JWT token
            try:
                token = auth_header.split(" ")[1]  
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                candidate_email = decoded_token.get("email")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Find the job post
            job = job_collection.find_one({"_id": ObjectId(job_id)})

            if not job:
                return JsonResponse({"message": "Job not found"}, status=404)

            # Check candidate test status
            candidate = next(
                (c for c in job["selected_candidates"] if c["email"] == candidate_email), 
                None
            )

            if not candidate:
                return JsonResponse({"test_status": "Not Attempted"}, status=200)

            return JsonResponse({"test_status": candidate.get("test_status", "Not Attempted")}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def candidate_test(request):
    if request.method == "POST":
        try:
            # Extract token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Token is missing"}, status=401)

            token = auth_header.split(" ")[1]

            try:
                # Decode JWT to get user email
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                email = decoded_token.get("email")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token has expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Get candidate answers from request
            data = json.loads(request.body.decode("utf-8"))
            candidate_answers = data.get("answers", {})

            if not candidate_answers:
                return JsonResponse({"message": "Answers are required"}, status=400)

            # Fetch stored questions from MongoDB
            candidate_data = candidate_collection.find_one({"email": email})
            if not candidate_data or "generated_questions" not in candidate_data:
                return JsonResponse({"message": "No generated questions found for this candidate"}, status=404)

            generated_questions = candidate_data["generated_questions"]
            question_scores = []
            total_score = 0

            def check_keywords(answer, keywords):
                """
                Check for multiple keywords in the answer.
                Returns tuple of (matched_keywords_count, total_keywords_count).
                """
                if not isinstance(keywords, list):  # Ensure keywords is a list
                    return 0, 0

                answer = answer.lower()
                matched_keywords = sum(1 for keyword in keywords if keyword.lower().strip() in answer)

                return matched_keywords, len(keywords)

            # Compare answers with expected keywords
            for question_data in generated_questions:
                question_text = question_data.get("question", "")
                expected_keywords = question_data.get("keywords", [])  # ✅ Corrected field name

                candidate_response = candidate_answers.get(question_text, "").strip()

                # Ensure expected_keywords is a valid list
                if not isinstance(expected_keywords, list):
                    expected_keywords = []

                # Get number of matched keywords and total keywords
                matched, total = check_keywords(candidate_response, expected_keywords)

                # Calculate score for this question (each keyword worth equal portion)
                question_score = (matched / total) if total > 0 else 0
                total_score += question_score

                # Store detailed scoring information
                question_scores.append({
                    "question": question_text,
                    "expected_keywords": expected_keywords,
                    "matched_keywords": matched,
                    "total_keywords": total,
                    "score": round(question_score, 2)
                })

            # Calculate final score percentage
            total_questions = len(generated_questions)
            score_percentage = (total_score / total_questions) * 100 if total_questions > 0 else 0

            # Determine profile status
            profile_status = "Verified" if score_percentage >= 60 else "Pending"

            # Update candidate profile status in MongoDB
            candidate_collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "profile_status": profile_status,
                        "test_results": {
                            "score_percentage": round(score_percentage, 2),
                            "question_scores": question_scores,
                            "total_score": round(total_score, 2),
                            "total_questions": total_questions,
                            "test_date": datetime.utcnow()
                        }
                    }
                }
            )

            return JsonResponse({
                "message": "Test evaluated successfully",
                "score_percentage": round(score_percentage, 2),
                "profile_status": profile_status,
                "detailed_scores": {
                    "total_score": round(total_score, 2),
                    "total_questions": total_questions,
                    "question_scores": question_scores
                }
            }, status=200)

        except Exception as e:
            return JsonResponse({"message": "Error evaluating test", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def get_candidate_profile(request):
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

            # Fetch candidate details from MongoDB
            candidate = candidate_collection.find_one({"email": email})
            if not candidate:
                return JsonResponse({"message": "Candidate not found"}, status=404)

            # Convert ObjectId to string for serialization
            candidate["_id"] = str(candidate["_id"])

            return JsonResponse(candidate, safe=False)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def get_matched_jobs(request):
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

            # Fetch candidate details from MongoDB
            candidate = candidate_collection.find_one({"email": email})
            if not candidate:
                return JsonResponse({"message": "Candidate not found"}, status=404)

            # Check if the profile is verified
            if "profile_status" not in candidate:
                return JsonResponse({"message": "Profile not verified"}, status=403)
            if candidate["profile_status"] == "Pending":
                return JsonResponse({"message": "Profile verification pending"}, status=403)

            # Convert skills to lowercase for better matching
            candidate_skills = [skill.lower() for skill in candidate["resume_skills"]]

            # Query jobs where any skill in `resume_skills` matches `skills_required`
            matched_jobs = list(job_collection.find({
                "$or": [
                    {"skills_required": {"$in": candidate_skills}},  # If skills_required is an array
                    {"skills_required": {"$regex": "|".join(candidate_skills), "$options": "i"}}  # If stored as a string
                ]
            }))

            # Create response dictionary
            response_data = {
                "candidate_skills": candidate["resume_skills"],
                "matched_jobs": matched_jobs
            }

            return HttpResponse(json_util.dumps(response_data), content_type="application/json")

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

from django.http import HttpResponse, JsonResponse
from bson import json_util


@csrf_exempt
def get_matched_jobs(request):
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

            # Fetch candidate details from MongoDB
            candidate = candidate_collection.find_one({"email": email})
            if not candidate:
                return JsonResponse({"message": "Candidate not found"}, status=404)

            # Check if the profile is verified
            if "profile_status" not in candidate:
                return JsonResponse({"message": "Profile not verified"}, status=403)
            if candidate["profile_status"] == "Pending":
                return JsonResponse({"message": "Profile verification pending"}, status=403)

            # Convert skills to lowercase for better matching
            candidate_skills = [skill.lower() for skill in candidate["resume_skills"]]

            # Query jobs where any skill in `resume_skills` matches `skills_required`
            matched_jobs = list(job_collection.find({
                "$or": [
                    {"skills_required": {"$in": candidate_skills}},  # If skills_required is an array
                    {"skills_required": {"$regex": "|".join(candidate_skills), "$options": "i"}}  # If stored as a string
                ]
            }))

            # Create response dictionary
            response_data = {
                "candidate_skills": candidate["resume_skills"],
                "matched_jobs": matched_jobs
            }

            return HttpResponse(json_util.dumps(response_data), content_type="application/json")

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)

@csrf_exempt
def check_application_status(request, job_id):
    if request.method == "GET":
        try:
            # Extract JWT Token
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JsonResponse({"message": "Token is missing"}, status=401)

            token = auth_header.split(" ")[1]  # Extract the token
            try:
                decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                candidate_email = decoded_token.get("email")
            except jwt.ExpiredSignatureError:
                return JsonResponse({"message": "Token has expired"}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({"message": "Invalid token"}, status=401)

            # Fetch Job Details
            job = job_collection.find_one({"_id": ObjectId(job_id)})
            if not job:
                return JsonResponse({"message": "Job not found"}, status=404)

            # Check if candidate is already in selected_candidates (Passed & Applied)
            selected_candidate = next((c for c in job.get("selected_candidates", []) if c["email"] == candidate_email), None)

            if selected_candidate:
                return JsonResponse({
                    "applied": True,
                    "passed": True,
                    "test_status": "selected",
                    "message": "You have been selected for this job."
                }, status=200)

            # Check if candidate has applied but failed or not passed
            applied_candidate = next((c for c in job.get("applied_candidates", []) if c["email"] == candidate_email), None)

            if applied_candidate:
                passed = applied_candidate.get("test_status") == "passed"
                return JsonResponse({
                    "applied": True,
                    "passed": passed,
                    "test_status": applied_candidate.get("test_status"),
                    "message": "You have applied and passed the test!" if passed else "You have failed the test."
                }, status=200)

            return JsonResponse({
                "applied": False,
                "passed": False,
                "test_status": "not_attempted",
                "message": "You have not applied for this job yet."
            }, status=200)

        except Exception as e:
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method"}, status=405)