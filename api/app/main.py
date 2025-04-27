from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.init_db import create_tables
from app.routers import loans, documents, users

app = FastAPI(
    title="Vehicle Loan API",
    description="API for vehicle loan processing application",
    version="0.1.0",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.on_event("startup")
async def startup_event():
    # Create database tables on startup
    create_tables()

@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check endpoint to verify API is running"""
    return {"status": "healthy", "message": "Vehicle Loan API is running"}