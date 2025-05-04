"""
Main application file for the FastAPI app.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create FastAPI application
app = FastAPI(
    title="Document Processing API",
    description="API for processing documents with LLMs using Langchain and Langgraph",
    version="0.1.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify the allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router, prefix="/api", tags=["documents"])