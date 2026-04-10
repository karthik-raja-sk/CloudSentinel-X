from typing import Dict, Set

ORG_ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "org_admin": {
        "org:view",
        "org:member:manage",
        "org:invite:create",
        "project:create",
        "project:view",
    },
    "org_member": {
        "org:view",
        "project:view",
    },
}

PROJECT_ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "admin": {"project:view", "project:scan:run", "project:member:manage", "project:findings:write"},
    "analyst": {"project:view", "project:scan:run", "project:findings:write"},
    "viewer": {"project:view"},
}


def has_org_permission(role: str | None, permission: str) -> bool:
    if not role:
        return False
    return permission in ORG_ROLE_PERMISSIONS.get(role.lower(), set())


def has_project_permission(role: str | None, permission: str) -> bool:
    if not role:
        return False
    return permission in PROJECT_ROLE_PERMISSIONS.get(role.lower(), set())
