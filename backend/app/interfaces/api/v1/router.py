from fastapi import APIRouter

from app.interfaces.api.v1 import (
    admin_audit,
    analysis,
    admin_health,
    admin_scoring,
    assets,
    auth,
    companies,
    matches,
    notifications,
    predictions,
    rankings,
    statistics,
    users,
)

api_router = APIRouter()
api_router.include_router(admin_audit.router)
api_router.include_router(admin_health.router)
api_router.include_router(admin_scoring.router)
api_router.include_router(assets.router)
api_router.include_router(auth.router)
api_router.include_router(companies.router)
api_router.include_router(matches.router)
api_router.include_router(predictions.router)
api_router.include_router(rankings.router)
api_router.include_router(analysis.router)
api_router.include_router(notifications.router)
api_router.include_router(users.router)
api_router.include_router(statistics.router)
