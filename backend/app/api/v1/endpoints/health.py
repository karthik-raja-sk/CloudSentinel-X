from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def check_health():
    return {"status": "ok", "version": "v1.0.0"}
