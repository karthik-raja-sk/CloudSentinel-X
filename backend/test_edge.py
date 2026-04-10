from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
import secrets

client = TestClient(app)

def test_refresh_token_missing():
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 401
    assert "missing" in response.json()['detail']
    print("PASS: Missing refresh token properly rejected.")

def test_demo_analyst_access():
    response = client.post("/api/v1/auth/demo-login", json={"role": "Analyst"})
    assert response.status_code == 200
    assert "access_token" in response.json()
    print("PASS: Demo analyst token issued securely.")

def test_rbac_admin_guard():
    # Login as demo analyst
    login_res = client.post("/api/v1/auth/demo-login", json={"role": "Analyst"})
    token = login_res.json()["access_token"]
    
    # Attempt to hit admin endpoint (audit)
    audit_res = client.get("/api/v1/auth/audit", headers={"Authorization": f"Bearer {token}"})
    assert audit_res.status_code == 403
    print("PASS: RBAC properly guards admin routes with 403 Forbidden.")

def test_invalid_reset_token():
    response = client.post("/api/v1/auth/reset-password", json={"token": secrets.token_urlsafe(32), "new_password": "fake"})
    assert response.status_code == 400
    assert "Invalid reset token" in response.json()['detail']
    print("PASS: Invalid Reset gracefully caught.")

if __name__ == "__main__":
    test_refresh_token_missing()
    test_demo_analyst_access()
    test_rbac_admin_guard()
    test_invalid_reset_token()
    print("ALL TESTS PASSED SUCCESSFULLY.")
