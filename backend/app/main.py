from fastapi import FastAPI
from app.api.v1.routers import api_router as api_router_v1

app = FastAPI(
    title="Date Planner API",
    description="API for generating date plans.",
    version="1.0.0",
)

app.include_router(api_router_v1, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Date Planner API"}
