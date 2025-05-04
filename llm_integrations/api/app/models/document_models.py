"""
Models for document processing API aligned with the main application models.
"""
from typing import Dict, Any, Optional, List, Union
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime

# Original LLM models
class LLMProvider(str, Enum):
    """Supported LLM providers for document processing."""
    GEMINI = "gemini"

class DocumentProcessingResponse(BaseModel):
    """Response model for document processing results."""
    extracted_data: Dict[str, Any] = Field(
        description="The extracted data from the document in JSON format"
    )
    confidence: float = Field(
        description="Confidence score of the extraction (0-1)",
        ge=0.0,
        le=1.0
    )
    processing_time: float = Field(
        description="Time taken to process the document in seconds"
    )
    document_type: str = Field(
        description="Detected document type"
    )
    errors: Optional[List[str]] = Field(
        default=None,
        description="Any errors encountered during processing"
    )
    provider: Optional[str] = Field(
        default=None,
        description="LLM provider used for processing"
    )
    # Adding new fields for frontend display
    summary: Optional[str] = Field(
        default=None,
        description="Summary of the document content"
    )
    entities: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="List of extracted entities with type and value"
    )
    content: Optional[str] = Field(
        default=None,
        description="Full analyzed content"
    )

class ProcessingOptions(BaseModel):
    """Options for document processing."""
    extract_tables: bool = Field(default=True, description="Whether to extract tables from the document")
    extract_forms: bool = Field(default=True, description="Whether to extract form fields")
    summarize: bool = Field(default=False, description="Whether to include a summary of the document")
    model_name: str = Field(default="gemini-1.5-pro", description="LLM model to use for processing")
    provider: LLMProvider = Field(default=LLMProvider.GEMINI, description="LLM provider to use for processing")

# Models from the main application
class LoanStatus(str, Enum):
    """Status of a loan application."""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    FUNDED = "funded"
    CLOSED = "closed"

class DocumentStatus(str, Enum):
    """Status of a document."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class BorrowerModel(BaseModel):
    """Model for borrower information."""
    is_co_borrower: bool = False
    full_name: Optional[str] = Field(default=None, description="Full name of the borrower")
    email: Optional[str] = Field(default=None, description="Email address of the borrower")
    phone: Optional[str] = Field(default=None, description="Phone number of the borrower")
    credit_score: Optional[int] = Field(default=None, description="Credit score of the borrower")
    annual_income: Optional[float] = Field(default=None, description="Annual income of the borrower")
    employment_status: Optional[str] = Field(default=None, description="Employment status of the borrower")
    employer: Optional[str] = Field(default=None, description="Employer of the borrower")
    years_at_job: Optional[float] = Field(default=None, description="Years at current job")

class VehicleDetailsModel(BaseModel):
    """Model for vehicle details."""
    make: Optional[str] = Field(default=None, description="Make of the vehicle")
    model: Optional[str] = Field(default=None, description="Model of the vehicle")
    year: Optional[int] = Field(default=None, description="Year of the vehicle")
    vin: Optional[str] = Field(default=None, description="VIN of the vehicle")
    color: Optional[str] = Field(default=None, description="Color of the vehicle")
    mileage: Optional[int] = Field(default=None, description="Mileage of the vehicle")
    condition: Optional[str] = Field(default=None, description="Condition of the vehicle")
    vehicle_value: Optional[float] = Field(default=None, description="Value of the vehicle")

class LoanApplicationModel(BaseModel):
    """Model for loan application."""
    application_number: Optional[str] = Field(default=None, description="Application number")
    vehicle_make: Optional[str] = Field(default=None, description="Make of the vehicle")
    vehicle_model: Optional[str] = Field(default=None, description="Model of the vehicle")
    vehicle_year: Optional[int] = Field(default=None, description="Year of the vehicle")
    vehicle_price: Optional[float] = Field(default=None, description="Price of the vehicle")
    loan_amount: Optional[float] = Field(default=None, description="Amount of the loan")
    loan_term_months: Optional[int] = Field(default=None, description="Term of the loan in months")
    interest_rate: Optional[float] = Field(default=None, description="Interest rate of the loan")
    monthly_payment: Optional[float] = Field(default=None, description="Monthly payment amount")
    status: Optional[LoanStatus] = Field(default=LoanStatus.PENDING, description="Status of the loan application")
    borrowers: Optional[List[BorrowerModel]] = Field(default=[], description="Borrowers on the loan")
    vehicle_details: Optional[VehicleDetailsModel] = Field(default=None, description="Detailed vehicle information")

class DocumentAnalysisResponse(BaseModel):
    """Enhanced response model for document analysis."""
    document_type: str = Field(..., description="Type of document analyzed")
    confidence: float = Field(..., description="Confidence score of the extraction (0-1)")
    processing_time: float = Field(..., description="Time taken to process the document in seconds")
    summary: Optional[str] = Field(default=None, description="Summary of the document content")
    entities: List[Dict[str, str]] = Field(default=[], description="Extracted entities with type and value")
    content: Optional[str] = Field(default=None, description="Full analyzed content")
    loan_application: Optional[LoanApplicationModel] = Field(default=None, description="Extracted loan application data") 
    errors: Optional[List[str]] = Field(default=None, description="Any errors encountered during processing")
    provider: Optional[str] = Field(default=None, description="LLM provider used for processing")