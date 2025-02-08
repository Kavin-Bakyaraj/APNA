from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, random
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt

client = MongoClient('mongodb+srv://kavinkavin8466:kavinbox@apnaclone.bwrct.mongodb.net/')
db = client['apnaclone']
hr_collection = db['hr']
SECRET_KEY = "apna"

@csrf_exempt
def hr_register(request):
    if request.method == "POST":
        try:
            # Check if request body is empty
            if not request.body:
                return JsonResponse({"message": "Request body is empty"}, status=400)

            data = json.loads(request.body)

            # Debugging: Print received data
            print("Received Data:", data)

            # Ensure required fields are present
            if "email" not in data or "name" not in data or "password" not in data:
                return JsonResponse({"message": "Missing required fields"}, status=400)

            existing_user = hr_collection.find_one({"email": data["email"]})
            if existing_user:
                return JsonResponse({"message": "Email already registered"}, status=400)

            # Insert into MongoDB
            hr_collection.insert_one({
                "name": data["name"],
                "email": data["email"],
                "password": data["password"],  # Store securely in production
                "otp": None,
                "otp_expiry": None
            })

            return JsonResponse({"message": "HR registered successfully"}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=400)

        except Exception as e:
            print("Error:", str(e))  # Print error in Django console
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)


@csrf_exempt
def hr_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            user = hr_collection.find_one({"email": data["email"], "password": data["password"]})
            if not user:
                return JsonResponse({"message": "Invalid credentials"}, status=401)

            # Ensure payload is properly structured
            payload = {
                "email": user["email"],
                "exp": datetime.utcnow() + timedelta(hours=1)
            }

            # Generate JWT token
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            return JsonResponse({"token": token})

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=400)

        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({"message": "Internal Server Error", "error": str(e)}, status=500)


@csrf_exempt
def hr_forgot_password(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user = hr_collection.find_one({"email": data["email"]})
        if not user:
            return JsonResponse({"message": "Email not found"}, status=404)

        otp = random.randint(100000, 999999)
        hr_collection.update_one({"email": data["email"]}, {"$set": {"otp": otp, "otp_expiry": datetime.utcnow() + timedelta(minutes=10)}})
        return JsonResponse({"message": "OTP sent to email", "otp": otp})

@csrf_exempt
def hr_reset_password(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user = hr_collection.find_one({"email": data["email"], "otp": data["otp"]})
        if not user:
            return JsonResponse({"message": "Invalid OTP"}, status=400)

        hr_collection.update_one({"email": data["email"]}, {"$set": {"password": data["new_password"], "otp": None}})
        return JsonResponse({"message": "Password reset successful"})
