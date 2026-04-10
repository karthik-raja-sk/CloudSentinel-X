from fastapi import APIRouter, Depends
from app.api.v1.endpoints import auth, health, projects, scans, uploads, findings, dashboard, iam, logs, attack_paths, analytics, redaction, malware, data_leaks, incidents, organizations
from app.api import deps

api_router = APIRouter()

# Health and Auth and Analytics/Redaction don't strictly need user auth
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])

# Protected routes
protected_dependencies = [Depends(deps.get_current_active_user)]
api_router.include_router(projects.router, prefix="/projects", tags=["projects"], dependencies=protected_dependencies)
api_router.include_router(scans.router, prefix="/scans", tags=["scans"], dependencies=protected_dependencies)
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"], dependencies=protected_dependencies)
api_router.include_router(findings.router, prefix="/findings", tags=["findings"], dependencies=protected_dependencies)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], dependencies=protected_dependencies)
api_router.include_router(iam.router, prefix="/iam", tags=["iam"], dependencies=protected_dependencies)
api_router.include_router(logs.router, prefix="/logs", tags=["logs"], dependencies=protected_dependencies)
api_router.include_router(attack_paths.router, prefix="/attack-paths", tags=["attack_paths"], dependencies=protected_dependencies)
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"], dependencies=protected_dependencies)
api_router.include_router(redaction.router, prefix="/redaction", tags=["redaction"], dependencies=protected_dependencies)
api_router.include_router(malware.router, prefix="/malware", tags=["malware"], dependencies=protected_dependencies)
api_router.include_router(data_leaks.router, prefix="/data-leaks", tags=["data-leaks"], dependencies=protected_dependencies)
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"], dependencies=protected_dependencies)

