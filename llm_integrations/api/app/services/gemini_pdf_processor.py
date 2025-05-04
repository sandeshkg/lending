"""
Service for processing PDF documents using Google Gemini directly.
"""
import time
import os
import json
import re
import hashlib
from typing import Dict, Any, Optional, List
import logging
import base64
from functools import lru_cache

from google import genai
from google.genai import types
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PDFProcessingState(BaseModel):
    """State model for the PDF processing."""
    pdf_bytes: bytes
    document_type: str = "unknown"
    extracted_data: Dict[str, Any] = {}
    confidence: float = 0.0
    errors: List[str] = []
    options: Dict[str, Any] = {}
    processing_time: float = 0.0


class LLMCache:
    """Simple cache for LLM responses."""
    
    def __init__(self, enabled: bool = True):
        """Initialize the cache.
        
        Args:
            enabled: Whether the cache is enabled (default: True)
        """
        self.cache = {}
        self.enabled = enabled
        logger.info(f"LLM Cache initialized. Enabled: {enabled}")
        
    def get_key(self, pdf_bytes: bytes, options: Dict[str, Any]) -> str:
        """Generate a cache key based on PDF content and options.
        
        Args:
            pdf_bytes: PDF file content
            options: Processing options
            
        Returns:
            Cache key string
        """
        # Create a hash of the PDF content
        pdf_hash = hashlib.md5(pdf_bytes).hexdigest()
        
        # Create a hash of the options
        options_str = json.dumps(options, sort_keys=True)
        options_hash = hashlib.md5(options_str.encode()).hexdigest()
        
        # Combine the hashes
        return f"{pdf_hash}_{options_hash}"
    
    def get(self, pdf_bytes: bytes, options: Dict[str, Any]) -> Optional[PDFProcessingState]:
        """Get a cached processing state.
        
        Args:
            pdf_bytes: PDF file content
            options: Processing options
            
        Returns:
            Cached processing state or None if not found
        """
        # First check if caching is enabled
        if not self.enabled:
            logger.info("Cache is disabled - skipping cache lookup")
            return None
        
        # Generate key and look for it in cache    
        key = self.get_key(pdf_bytes, options)
        logger.info(f"Checking cache with key: {key[:10]}...")
        logger.info(f"Cache status: enabled={self.enabled}, items in cache: {len(self.cache)}")
        
        # List all keys in cache for debugging
        if self.cache:
            logger.info(f"Current cache keys: {[k[:10] for k in self.cache.keys()]}")
        
        if key in self.cache:
            logger.info(f"Cache HIT for key: {key[:10]}...")
            
            # Get the cached state and log its structure in detail
            cached_state = self.cache[key]
            
            # Debug log the full structure of extracted_data
            if cached_state and cached_state.extracted_data:
                logger.info(f"Cache HIT extracted_data keys: {list(cached_state.extracted_data.keys())}")
                
                # Check for loan_application specifically
                if "loan_application" in cached_state.extracted_data:
                    loan_app = cached_state.extracted_data["loan_application"]
                    logger.info(f"Cache HIT loan_application keys: {list(loan_app.keys() if isinstance(loan_app, dict) else [])}")
                    
                    # Check for borrowers specifically
                    if isinstance(loan_app, dict) and "borrowers" in loan_app:
                        logger.info(f"Cache HIT borrowers: {loan_app['borrowers']}")
                    else:
                        logger.warning("Cache HIT but no borrowers in loan_application")
                else:
                    logger.warning("Cache HIT but no loan_application in extracted_data")
            
            return cached_state
        
        logger.info(f"Cache MISS for key: {key[:10]}...")
        return None
    
    def set(self, pdf_bytes: bytes, options: Dict[str, Any], state: PDFProcessingState) -> None:
        """Set a cache entry.
        
        Args:
            pdf_bytes: PDF file content
            options: Processing options
            state: Processing state to cache
        """
        if not self.enabled:
            logger.info("Cache is disabled - not caching result")
            return
        
        key = self.get_key(pdf_bytes, options)
        logger.info(f"Storing result in cache with key: {key[:10]}...")
        
        # Log the content being stored
        logger.info(f"Caching state with document_type: {state.document_type}, extracted_data keys: {list(state.extracted_data.keys() if state.extracted_data else [])}")
        
        # Always make a deep copy of the state to ensure we preserve all nested structures
        # This approach works for any nested entity, not just specific ones like borrowers
        cached_state = PDFProcessingState(
            pdf_bytes=state.pdf_bytes,
            document_type=state.document_type,
            extracted_data=json.loads(json.dumps(state.extracted_data)) if state.extracted_data else {},  # Deep copy via JSON serialization
            confidence=state.confidence,
            errors=state.errors.copy() if state.errors else [],
            options=state.options.copy() if state.options else {},
            processing_time=state.processing_time
        )
        
        self.cache[key] = cached_state
        logger.info(f"Cache updated - now contains {len(self.cache)} items")


class GeminiPDFProcessor:
    """Service for processing PDF documents with Google Gemini."""

    def __init__(self, google_api_key: Optional[str] = None):
        """Initialize the PDF processor with Google Gemini.
        
        Args:
            google_api_key: Google API key. If None, will try to use from environment.
        """
        self.google_api_key = google_api_key or os.environ.get("GOOGLE_API_KEY")
        if not self.google_api_key:
            raise ValueError("Google API key not provided and not found in environment (GOOGLE_API_KEY)")
            
        # Create a Google Generative AI Client
        self.client = genai.Client(api_key=self.google_api_key)
        
        # Initialize cache (enabled by default)
        cache_enabled = os.environ.get("CACHE_LLM_CALLS", "1") == "1"
        self.cache = LLMCache(enabled=cache_enabled)
    
    def _process_document(self, state: PDFProcessingState) -> PDFProcessingState:
        """Process the document with a single LLM call to detect type and extract data.
        
        Args:
            state: Current processing state
            
        Returns:
            Updated state with document type and extracted data
        """
        # Check cache first
        cached_state = self.cache.get(state.pdf_bytes, state.options)
        if (cached_state):
            logger.info("Using cached LLM result")
            return cached_state
            
        try:
            # Get PDF bytes
            pdf_bytes = state.pdf_bytes
            
            # Get model name from options with default to a Google Gemini model
            model_name = state.options.get("model_name", "gemini-1.5-pro")
            
            # Create a temporary file in memory to pass to the API
            pdf_data = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Instructions for document analysis
            instructions = """You are an expert loan document analyst. Analyze the attached PDF document to:
1. Determine what type of document it is (Sales Contract, Loan Application, Credit Report, etc.)
2. Extract ALL relevant loan information especially focusing on borrower details, co-borrower details, loan terms, and vehicle information

Structure your response as a JSON object with the following top-level fields:
1. document_type: The type of document (e.g., Sales Contract, Loan Application, etc.)
2. summary: A brief 1-2 sentence summary of the document content
3. entities: An array of key entities extracted from the document as name-value pairs
4. content: Detailed analysis of the document content

Additionally, include a detailed loan_application field with EXACTLY the following structure:

{
  "document_type": "Type of document",
  "summary": "Brief summary of the document content",
  "content": "Detailed analysis of the document",
  "entities": [
    {"label": "entity_name", "value": "entity_value"},
    {"label": "entity_name", "value": "entity_value"}
  ],
  "loan_application": {
    "loan_type": "Vehicle Loan",
    "loan_amount": 44046.14,
    "loan_term_months": 84,
    "interest_rate": 4.89,
    "monthly_payment": 620.27,
    "down_payment": null,
    "ltv_ratio": null,
    "application_date": "2025-05-04",
    "status": "pending",
    "vehicle_make": "Audi",
    "vehicle_model": "A6",
    "vehicle_year": 2022,
    "vehicle_price": 54210.79,
    "borrowers": [
      {
        "is_co_borrower": false,
        "full_name": "Linda Thompson",
        "email": "linda.thompson@aol.com",
        "phone": "(863) 204-4858",
        "credit_score": 695,
        "annual_income": 102138.15,
        "employment_status": "Retired",
        "employer": "Retail Consolidated",
        "years_at_job": 2.8
      },
      {
        "is_co_borrower": true,
        "full_name": "Mary Thomas",
        "email": "mary.thomas@outlook.com",
        "phone": "(368) 125-7139",
        "credit_score": 658,
        "annual_income": 109036.23,
        "employment_status": "Self-Employed",
        "employer": "Manufacturing Co.",
        "years_at_job": 6
      }
    ],
    "vehicle_details": {
      "make": "Audi",
      "model": "A6",
      "year": 2022,
      "vin": "8LJ5CPAAVYDMGNYFV",
      "color": "Gray",
      "mileage": 1850,
      "condition": "Excellent",
      "vehicle_value": 54210.79
    }
  },
  "confidence": 0.95
}

Make sure to:
1. Include ALL of the fields shown above in your response if they're found in the document
2. Format numbers correctly:
   - credit_score: integer (e.g., 695)
   - annual_income: float in dollars (e.g., 102138.15)
   - years_at_job: float (e.g., 2.8)
   - loan_amount: float in dollars (e.g., 44046.14)
   - interest_rate: float percentage without the % sign (e.g., 4.89)
   - monthly_payment: float (e.g., 620.27)
   - down_payment: float or null if not available
   - vehicle_year: integer (e.g., 2022)
   - vehicle_value: float (e.g., 54210.79)
   - mileage: integer without "miles" (e.g., 1850)
3. Never skip any of the required fields - set them to null if the information is not found
4. Always set is_co_borrower=false for the primary borrower and is_co_borrower=true for any co-borrower
5. Assign a confidence score (0.0 to 1.0) reflecting how certain you are about the extraction

The resulting JSON must contain ALL of these exact keys, formatted exactly as shown. This is critical for the data to be properly displayed in the loan application interface.

Important: Your response must be a valid JSON object."""
            
            # Create the content with PDF data and text instruction
            # We structure this differently depending on the version of the API
            try:
                # Try the newer approach first for v1+ compatibility
                contents = [
                    types.Content(
                        parts=[
                            types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                            types.Part.from_text(text = instructions +"Please analyze this PDF document.")
                        ]
                    )
                ]
                
                # Configure generation parameters
                config = types.GenerateContentConfig(
                    temperature=0,
                    top_p=1,
                    top_k=32,
                    max_output_tokens=8192,
                )
                
                # Try to add system instruction if supported
                try:
                    # Only in v1alpha and newer
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            temperature=0,
                            top_p=1,
                            top_k=32,
                            max_output_tokens=8192,
                            system_instruction=instructions
                        )
                    )
                except (ValueError, TypeError):
                    # Fallback to no system instruction
                    # Add instruction to content instead
                    contents = [
                        types.Content(
                            parts=[
                                types.Part(text = instructions + "\n\nPlease analyze this PDF document:"),
                                types.Part(data=pdf_bytes, mime_type="application/pdf")
                            ]
                        )
                    ]
                    
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config
                    )
                
            except (AttributeError, TypeError, ValueError) as e:
                # Handle older API versions or errors
                logger.error(f"Error generating content: {str(e)}")
                state.errors.append(f"Error generating content: {str(e)}")
                return state
            
            # Parse the JSON response
            result = self._parse_llm_response(response.text)
            
            # Update state with results
            if "document_type" in result:
                state.document_type = result["document_type"]
            
            # Handle different response formats
            # If it has extracted_data, use it directly
            if "extracted_data" in result and result["extracted_data"]:
                state.extracted_data = result["extracted_data"]
            else:
                # If it has loan_application and/or entities, combine them into extracted_data
                combined_data = {}
                
                # Add loan_application if present
                if "loan_application" in result and result["loan_application"]:
                    combined_data["loan_application"] = result["loan_application"]
                
                # Add entities if present
                if "entities" in result and result["entities"]:
                    combined_data["entities"] = result["entities"]
                    
                # Add summary if present
                if "summary" in result:
                    combined_data["summary"] = result["summary"]
                    
                # Add content if present
                if "content" in result:
                    combined_data["content"] = result["content"]
                
                # Set the combined data as extracted_data
                state.extracted_data = combined_data if combined_data else {}
            
            if "confidence" in result:
                # Use the confidence value provided by the LLM, or calculate it
                state.confidence = float(result["confidence"])
            else:
                # Estimate confidence based on presence of data
                num_fields = len(state.extracted_data)
                state.confidence = min(0.5 + (num_fields * 0.05), 1.0) if num_fields > 0 else 0.0
            
            # Cache the result
            self.cache.set(state.pdf_bytes, state.options, state)
            
            return state
        except Exception as e:
            error_msg = f"Error processing document: {str(e)}"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state
    
    def _parse_llm_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the LLM response to extract JSON data.
        
        Args:
            response_text: Text response from the LLM
            
        Returns:
            Dictionary with parsed data
        """
        try:
            # First attempt: try direct JSON loading if the response is already valid JSON
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                # Not valid JSON, continue with extraction
                pass
                
            # Second attempt: find JSON-like pattern and parse
            json_match = re.search(r'\{[\s\S]*\}', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
                try:
                    return json.loads(json_text)
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON: {str(e)}")
                    # Clean up the JSON text - remove comments and fix trailing commas
                    cleaned_json = re.sub(r'//.*?[\n\r]', '\n', json_text)  # Remove comments
                    cleaned_json = re.sub(r',(\s*[\]}])', r'\1', cleaned_json)  # Remove trailing commas
                    
                    try:
                        return json.loads(cleaned_json)
                    except json.JSONDecodeError:
                        logger.warning("Still failed to parse JSON after cleanup")
            
            # Third attempt: Extract individual fields if full JSON parsing failed
            logger.info("Attempting to extract fields from response")
            result = {}
            
            # Try to extract document type
            doc_type_match = re.search(r'"document_type"\s*:\s*"([^"]+)"', response_text)
            if doc_type_match:
                result["document_type"] = doc_type_match.group(1).strip()
            else:
                # Try alternative pattern without quotes
                doc_type_alt_match = re.search(r'document_type\s*:\s*([^,\n\r]+)', response_text)
                if doc_type_alt_match:
                    result["document_type"] = doc_type_alt_match.group(1).strip().strip('"')
                else:
                    result["document_type"] = "unknown"
            
            # Try to extract confidence
            confidence_match = re.search(r'"confidence"\s*:\s*([\d.]+)', response_text)
            if confidence_match:
                try:
                    result["confidence"] = float(confidence_match.group(1))
                except ValueError:
                    result["confidence"] = 0.3  # Default modest confidence
            else:
                result["confidence"] = 0.3  # Default modest confidence
            
            # Try to extract extracted_data, loan_application, or entities if present
            extracted_data_match = re.search(r'"extracted_data"\s*:\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response_text, re.DOTALL)
            if extracted_data_match:
                try:
                    extracted_data = json.loads(extracted_data_match.group(1))
                    result["extracted_data"] = extracted_data
                except json.JSONDecodeError:
                    result["extracted_data"] = {}
            else:
                result["extracted_data"] = {}
                
            # Try to extract loan_application if present
            loan_app_match = re.search(r'"loan_application"\s*:\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response_text, re.DOTALL)
            if loan_app_match:
                try:
                    loan_app_data = json.loads(loan_app_match.group(1))
                    result["loan_application"] = loan_app_data
                except json.JSONDecodeError:
                    result["loan_application"] = {}
            
            # Try to extract entities if present (array of objects)
            entities_match = re.search(r'"entities"\s*:\s*(\[[^\[\]]*(?:\{[^\{\}]*\}[^\[\]]*)*\])', response_text, re.DOTALL)
            if entities_match:
                try:
                    entities_data = json.loads(entities_match.group(1))
                    result["entities"] = entities_data
                except json.JSONDecodeError:
                    result["entities"] = []
            
            # If we at least have a document type, return what we found
            if result.get("document_type") != "unknown":
                logger.info(f"Extracted partial information: document_type={result['document_type']}")
                return result
            
            # If all else fails, return basic empty structure
            logger.warning("Unable to extract meaningful data from response")
            return {
                "document_type": "unknown",
                "extracted_data": {},
                "confidence": 0.0
            }
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            return {
                "document_type": "unknown",
                "extracted_data": {},
                "confidence": 0.0
            }
    
    async def process_pdf(self, pdf_bytes: bytes, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a PDF document and extract structured data.
        
        Args:
            pdf_bytes: The PDF file as bytes
            options: Processing options
            
        Returns:
            Dictionary with extracted data and metadata
        """
        start_time = time.time()
        
        # Set default options if not provided
        if options is None:
            options = {
                "model_name": "gemini-1.5-pro",  # Default to Google's Gemini model
                "extract_tables": True,
                "extract_forms": True,
                "summarize": False
            }
        
        try:
            # Prepare initial state with the raw PDF bytes
            initial_state = PDFProcessingState(
                pdf_bytes=pdf_bytes,
                options=options
            )
            
            # Run the processing directly
            final_state = self._process_document(initial_state)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            final_state.processing_time = processing_time
            
            # Return results
            return {
                "extracted_data": final_state.extracted_data,
                "confidence": final_state.confidence,
                "document_type": final_state.document_type,
                "processing_time": final_state.processing_time,
                "errors": final_state.errors if final_state.errors else None,
                "provider": "gemini"
            }
            
        except Exception as e:
            error_msg = f"Error processing PDF: {str(e)}"
            logger.error(error_msg)
            
            # Return error response
            return {
                "extracted_data": {},
                "confidence": 0.0,
                "document_type": "unknown",
                "processing_time": time.time() - start_time,
                "errors": [error_msg],
                "provider": "gemini"
            }