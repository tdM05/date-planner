from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routers import api_router as api_router_v1

app = FastAPI(
    title="Date Planner API",
    description="API for generating date plans.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now - can restrict later
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

app.include_router(api_router_v1, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Date Planner API"}
