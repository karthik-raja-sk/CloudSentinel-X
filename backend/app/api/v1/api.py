from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, projects, scans, uploads, findings, dashboard, iam, logs, attack_paths, analytics, redaction, malware, data_leaks, incidents

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(findings.router, prefix="/findings", tags=["findings"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(iam.router, prefix="/iam", tags=["iam"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(attack_paths.router, prefix="/attack-paths", tags=["attack_paths"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(redaction.router, prefix="/redaction", tags=["redaction"])
api_router.include_router(malware.router, prefix="/malware", tags=["malware"])
api_router.include_router(data_leaks.router, prefix="/data-leaks", tags=["data-leaks"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
