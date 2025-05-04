"""
Script to run the FastAPI application
"""
import uvicorn
import os
import argparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run the PDF processing API server")
    parser.add_argument(
        "--port", 
        type=int, 
        default=8001, 
        help="Port to run the server on (default: 8001)"
    )
    parser.add_argument(
        "--host", 
        type=str, 
        default="0.0.0.0", 
        help="Host to run the server on (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload on code changes"
    )
    parser.add_argument(
        "--no-cache-llm", 
        action="store_true", 
        help="Disable caching for LLM API calls (caching is enabled by default)"
    )
    
    args = parser.parse_args()
    
    # Set environment variables if they don't exist
    if not os.environ.get("GROQ_API_KEY"):
        print("Warning: GROQ_API_KEY environment variable not set.")
        print("Set it before running the application with:")
        print("export GROQ_API_KEY=your_api_key_here")
    
    # Set environment variable for LLM caching (enabled by default)
    os.environ["CACHE_LLM_CALLS"] = "0" if args.no_cache_llm else "1"
    if args.no_cache_llm:
        print("LLM API call caching is DISABLED")
    else:
        print("LLM API call caching is ENABLED (default)")
    
    # Run the FastAPI application
    print(f"Starting PDF processing API server on http://{args.host}:{args.port}")
    uvicorn.run(
        "app.main.app:app", 
        host=args.host, 
        port=args.port, 
        reload=args.reload
    )