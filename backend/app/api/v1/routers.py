from fastapi import APIRouter
from . import dates, auth, couples

api_router = APIRouter()
api_router.include_router(dates.router, prefix="/dates", tags=["dates"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(couples.router, prefix="/couples", tags=["couples"])
