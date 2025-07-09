from fastapi import APIRouter
from app.api.v1.endpoints import auth, analysis, dashboard, logs

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"]) 