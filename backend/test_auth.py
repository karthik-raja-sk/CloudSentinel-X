import requests
import json

try:
    res = requests.post(
        "http://localhost:8000/api/v1/auth/register",
        json={"email": "test4@example.com", "password": "password123", "full_name": "Test User 4"}
    )
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
