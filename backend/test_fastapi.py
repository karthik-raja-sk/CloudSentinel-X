from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
try:
    response = client.post("/api/v1/auth/register", json={"email": "testclient@example.com", "password": "password123", "full_name": "Test User 4"})
    print(response.status_code)
    print(response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
