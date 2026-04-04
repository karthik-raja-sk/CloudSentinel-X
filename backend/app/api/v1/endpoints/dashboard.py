from fastapi import APIRouter

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary():
    return {
        "total_projects": 0,
        "critical_findings": 0,
        "recent_scans": []
    }
