"""
Router for document processing endpoints.
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Form, Path, Query
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import os
import requests
import logging

from app.models.document_models import (
    DocumentProcessingResponse, ProcessingOptions, DocumentAnalysisResponse,
    LoanApplicationModel, VehicleDetailsModel, BorrowerModel
)
from app.services.pdf_processor_factory import PDFProcessorFactory
from app.services.gemini_pdf_processor import LLMCache

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

# Define the main API URL where document files are stored
MAIN_API_URL = "http://localhost:8000/api"

def get_pdf_processor(
    provider: str = Query("gemini", description="LLM provider to use"),
    force_refresh: bool = Query(False, description="Force refresh the LLM result instead of using cache")
):
    """Dependency to get PDF processor service based on selected provider."""
    try:
        # Temporarily override caching setting if force_refresh is True
        original_cache_setting = os.environ.get("CACHE_LLM_CALLS", "1")
        
        # Log the current cache setting
        logger.info(f"Current CACHE_LLM_CALLS setting: {original_cache_setting}")
        
        if force_refresh:
            # Temporarily disable cache
            os.environ["CACHE_LLM_CALLS"] = "0"
            logger.info("Cache temporarily disabled due to force_refresh=True")
        
        # Get processor
        processor = PDFProcessorFactory.get_processor(provider)
        
        # Log if cache is enabled in the processor
        logger.info(f"Processor created with cache enabled: {processor.cache.enabled}")
        
        # Restore original cache setting
        if force_refresh:
            os.environ["CACHE_LLM_CALLS"] = original_cache_setting
            logger.info(f"Cache setting restored to: {original_cache_setting}")
            
        return processor
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process", response_model=DocumentProcessingResponse)
async def process_document(
    file: UploadFile = File(...),
    provider: str = Query("gemini", description="LLM provider to use"),
    force_refresh: bool = Query(False, description="Force refresh the LLM result instead of using cache"),
    options: Optional[ProcessingOptions] = Depends(lambda: ProcessingOptions()),
    pdf_processor: Any = Depends(get_pdf_processor)
):
    """
    Process a PDF document and extract structured data.
    
    The endpoint accepts a PDF file and returns extracted structured data in JSON format.
    The extraction is performed by an LLM.
    
    Args:
        file: The PDF file to process
        provider: The LLM provider to use
        force_refresh: Force refresh the LLM result instead of using cache
        options: Processing options for the document
        pdf_processor: PDF processing service
        
    Returns:
        JSON response with extracted data and metadata
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        # Read file content
        file_content = await file.read()
        
        # Process the document
        result = await pdf_processor.process_pdf(
            pdf_bytes=file_content,
            options=options.dict()
        )
        
        # Return processing result
        return DocumentProcessingResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.post("/analyze", response_model=DocumentProcessingResponse)
async def analyze_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    provider: str = Form("gemini", description="LLM provider to use"),
    force_refresh: bool = Form(False, description="Force refresh the LLM result instead of using cache"),
    extract_tables: bool = Form(True),
    extract_forms: bool = Form(True),
    summarize: bool = Form(False),
    model_name: str = Form(None),
    pdf_processor: Any = Depends(get_pdf_processor)
):
    """
    Alternative endpoint for document analysis with form fields instead of JSON options.
    This is useful for direct form submissions.
    
    Args:
        background_tasks: FastAPI background tasks
        file: The PDF file to process
        provider: The LLM provider to use
        force_refresh: Force refresh the LLM result instead of using cache
        extract_tables: Whether to extract tables from the document
        extract_forms: Whether to extract form fields
        summarize: Whether to include a summary of the document
        model_name: LLM model to use for processing
        pdf_processor: PDF processing service
        
    Returns:
        JSON response with extracted data and metadata
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        # Read file content
        file_content = await file.read()
        
        # Set default model name if not specified
        if model_name is None:
            model_name = "gemini-2.0-flash"
        
        # Create options dictionary
        options = {
            "extract_tables": extract_tables,
            "extract_forms": extract_forms,
            "summarize": summarize,
            "model_name": model_name
        }
        
        # Process the document
        result = await pdf_processor.process_pdf(
            pdf_bytes=file_content,
            options=options
        )
        
        # Return processing result
        return DocumentProcessingResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.get("/analyze/{document_id}", response_model=DocumentAnalysisResponse)
@router.post("/analyze/{document_id}", response_model=DocumentAnalysisResponse)
async def analyze_document_by_id(
    document_id: str = Path(..., description="The ID of the document to analyze"),
    provider: str = Query("gemini", description="LLM provider to use"),
    force_refresh: bool = Query(False, description="Force refresh the LLM result instead of using cache"),
    pdf_processor: Any = Depends(get_pdf_processor)
):
    """
    Analyze a document by its ID. This endpoint retrieves the document from the main API
    and processes it using the LLM. Supports both GET and POST methods.
    
    Args:
        document_id: The ID of the document to analyze
        provider: The LLM provider to use
        force_refresh: Force refresh the LLM result instead of using cache
        pdf_processor: PDF processing service
        
    Returns:
        JSON response with extracted data and metadata using the document analysis models
    """
    try:
        # Fetch the document file from the main API
        document_url = f"{MAIN_API_URL}/documents/file/{document_id}"
        response = requests.get(document_url)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Error fetching document from main API: {response.text}"
            )
            
        # Process the document with default options
        options = {
            "extract_tables": True,
            "extract_forms": True,
            "summarize": True,
            "model_name": "gemini-2.0-flash"
        }
        
        # Process the document
        result = await pdf_processor.process_pdf(
            pdf_bytes=response.content,
            options=options
        )
        
        # Debug log the result structure received from processor
        logger.info(f"Result from process_pdf: document_type={result['document_type']}, keys in extracted_data: {list(result.get('extracted_data', {}).keys())}")
        
        # If loan_application exists, log its structure
        if result.get('extracted_data', {}).get('loan_application'):
            loan_app = result['extracted_data']['loan_application']
            logger.info(f"Loan application keys: {list(loan_app.keys())}")
            
            # Check for borrowers
            if 'borrowers' in loan_app:
                logger.info(f"Borrowers in result: {loan_app['borrowers']}")
            else:
                logger.warning("No borrowers found in loan_application from result")
                
        # Format the response using our new model
        analysis_response = DocumentAnalysisResponse(
            document_type=result["document_type"],
            confidence=result["confidence"],
            processing_time=result["processing_time"],
            errors=result.get("errors"),
            provider=result.get("provider", "gemini"),
            
            # Extract summary, entities, and content from the extracted_data
            summary=result.get("extracted_data", {}).get("summary", ""),
            content=result.get("extracted_data", {}).get("content", "")
        )
        
        # Extract entities
        extracted_data = result.get("extracted_data", {})
        entities = []
        
        # Create entities list for display in the UI
        for key, value in extracted_data.items():
            if isinstance(value, (str, int, float)) and key not in ["summary", "content"]:
                entities.append({"label": key, "value": str(value)})
            elif isinstance(value, dict) and key not in ["loan_application", "vehicle_details", "borrowers"]:
                # Handle nested objects
                for nested_key, nested_value in value.items():
                    if isinstance(nested_value, (str, int, float)):
                        entities.append({"label": f"{key}.{nested_key}", "value": str(nested_value)})
        
        analysis_response.entities = entities
        
        # Try to extract a loan application model from the data
        try:
            # Check if we have loan application data
            if "loan_application" in extracted_data:
                loan_data = extracted_data["loan_application"]
                logger.info(f"Building loan application model from loan_data keys: {list(loan_data.keys())}")
                
                # Create borrowers if present
                borrowers = []
                if "borrowers" in loan_data:
                    logger.info(f"Found borrowers in loan_data: {loan_data['borrowers']}")
                    for borrower_data in loan_data["borrowers"]:
                        logger.info(f"Creating borrower model from: {borrower_data}")
                        borrowers.append(BorrowerModel(**borrower_data))
                    logger.info(f"Created {len(borrowers)} borrower models")
                else:
                    logger.warning("No borrowers found in loan_data when creating models")
                
                # Create vehicle details if present
                vehicle_details = None
                if "vehicle_details" in loan_data:
                    vehicle_details = VehicleDetailsModel(**loan_data["vehicle_details"])
                
                # Create a copy of loan_data so we can modify it safely
                loan_data_copy = loan_data.copy()
                
                # Remove nested objects from loan_data for direct mapping
                if "borrowers" in loan_data_copy:
                    del loan_data_copy["borrowers"]
                if "vehicle_details" in loan_data_copy:
                    del loan_data_copy["vehicle_details"]
                
                # Create the loan application model
                logger.info(f"Creating loan application model with fields: {list(loan_data_copy.keys())}")
                loan_application = LoanApplicationModel(**loan_data_copy)
                
                # Add borrowers and vehicle details to the model
                if borrowers:
                    logger.info(f"Adding {len(borrowers)} borrowers to loan application")
                    loan_application.borrowers = borrowers
                else:
                    logger.warning("No borrowers to add to loan application")
                    
                if vehicle_details:
                    loan_application.vehicle_details = vehicle_details
                
                # Add the loan application to the response
                analysis_response.loan_application = loan_application
                logger.info("Successfully added loan application to response")
            
            # If no specific loan_application field exists, try to create one from the extracted data
            elif any(key in extracted_data for key in ["vehicle_make", "vehicle_model", "vehicle_year", "loan_amount"]):
                # Try to construct a loan application from the top-level data
                loan_data = {}
                
                # Copy fields that match the loan application model
                for field in LoanApplicationModel.__annotations__:
                    if field in extracted_data:
                        loan_data[field] = extracted_data[field]
                
                # Create vehicle details if possible
                vehicle_details_data = {}
                for field in VehicleDetailsModel.__annotations__:
                    vehicle_field_value = extracted_data.get(f"vehicle_{field}", extracted_data.get(field))
                    if vehicle_field_value is not None:
                        vehicle_details_data[field] = vehicle_field_value
                
                # Create borrower details if possible
                borrower_data = {}
                borrower_fields = ["full_name", "email", "phone", "credit_score", "annual_income"]
                for field in borrower_fields:
                    if field in extracted_data or f"borrower_{field}" in extracted_data:
                        borrower_data[field] = extracted_data.get(f"borrower_{field}", extracted_data.get(field))
                
                # Create the loan application model
                if loan_data:
                    loan_application = LoanApplicationModel(**loan_data)
                    
                    if vehicle_details_data and len(vehicle_details_data) >= 3:  # Ensure we have enough vehicle data
                        loan_application.vehicle_details = VehicleDetailsModel(**vehicle_details_data)
                    
                    if borrower_data and "full_name" in borrower_data:  # Ensure we have at least the name
                        loan_application.borrowers = [BorrowerModel(**borrower_data)]
                    
                    analysis_response.loan_application = loan_application
        
        except Exception as e:
            logger.warning(f"Error creating loan application model: {str(e)}")
            # Include the error but continue with the response
            if analysis_response.errors:
                analysis_response.errors.append(f"Error formatting loan data: {str(e)}")
            else:
                analysis_response.errors = [f"Error formatting loan data: {str(e)}"]
        
        return analysis_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.get("/cache/status")
async def get_cache_status():
    """
    Get the current LLM cache status.
    
    Returns:
        JSON response with cache status
    """
    cache_enabled = os.environ.get("CACHE_LLM_CALLS", "0") == "1"
    return {
        "cache_enabled": cache_enabled
    }

@router.post("/cache/clear")
async def clear_cache():
    """
    Clear the LLM cache.
    
    Returns:
        JSON response confirming cache cleared
    """
    # Create a temporary processor to access and clear the cache
    processor = PDFProcessorFactory.get_processor()
    
    # Reset the cache by creating a new empty one with the same enabled status
    cache_enabled = processor.cache.enabled
    processor.cache = LLMCache(enabled=cache_enabled)
    
    return {
        "message": "LLM cache cleared successfully",
        "cache_enabled": cache_enabled
    }