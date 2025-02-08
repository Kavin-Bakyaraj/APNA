from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, random
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt  # For password hashing

# MongoDB Connection
client = MongoClient('mongodb+srv://kavinkavin8466:kavinbox@apnaclone.bwrct.mongodb.net/')
db = client['apnaclone']
candidate_collection = db['candidate']

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
        
        hashed_password = hash_password(data["password"])  # Hash the password
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
        otp_expiry = datetime.utcnow() + timedelta(minutes=10)  # Set OTP expiry
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
