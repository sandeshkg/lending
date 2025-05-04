from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Union
from datetime import datetime
from app.models.models import LoanStatus, DocumentStatus, TimelineEventType

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# Add the missing UserResponse schema used in the users.py router
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    is_admin: bool
    lending_authority_level: int = 1
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# Borrower schemas
class BorrowerBase(BaseModel):
    full_name: str
    email: str
    phone: str
    credit_score: int = Field(..., ge=300, le=850)
    annual_income: float = Field(..., gt=0)
    employment_status: str
    employer: str
    years_at_job: float = Field(..., ge=0)
    is_co_borrower: bool = False

class BorrowerCreate(BorrowerBase):
    loan_id: int

class BorrowerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    credit_score: Optional[int] = None
    annual_income: Optional[float] = None
    employment_status: Optional[str] = None
    employer: Optional[str] = None
    years_at_job: Optional[float] = None

class BorrowerResponse(BorrowerBase):
    id: int
    loan_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# Document schemas
class DocumentBase(BaseModel):
    name: str

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[DocumentStatus] = None

class Document(DocumentBase):
    id: int
    loan_id: int
    file_path: str
    status: DocumentStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# Add the missing DocumentResponse schema used in the documents.py router
class DocumentResponse(Document):
    """Response model for document endpoints"""
    
    model_config = {"from_attributes": True}

# Timeline event schemas
class TimelineEventBase(BaseModel):
    event: str
    user: str
    type: TimelineEventType = TimelineEventType.INFO

class TimelineEventCreate(TimelineEventBase):
    pass

class TimelineEvent(TimelineEventBase):
    id: int
    loan_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class TimelineEventResponse(TimelineEventBase):
    id: int
    loan_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

# Note schemas
class NoteBase(BaseModel):
    author: str
    content: str

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    loan_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

# Vehicle details schemas
class VehicleDetailsBase(BaseModel):
    make: str
    model: str
    year: int = Field(..., ge=1900, le=2100)
    vin: str
    color: str
    mileage: int = Field(..., ge=0)
    condition: str
    vehicle_value: float = Field(..., gt=0)

class VehicleDetailsCreate(VehicleDetailsBase):
    loan_id: int

class VehicleDetailsUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    vin: Optional[str] = None
    color: Optional[str] = None
    mileage: Optional[int] = None
    condition: Optional[str] = None
    vehicle_value: Optional[float] = None

class VehicleDetailsResponse(VehicleDetailsBase):
    id: int
    loan_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# Loan application schemas
class LoanApplicationBase(BaseModel):
    vehicle_make: str
    vehicle_model: str
    vehicle_year: int = Field(..., ge=1900, le=2100)
    vehicle_price: float = Field(..., gt=0)
    loan_amount: float = Field(..., gt=0)
    loan_term_months: int = Field(..., ge=12, le=84)

    @field_validator('loan_amount')
    @classmethod
    def validate_loan_amount(cls, v, info):
        if 'vehicle_price' in info.data and v > info.data['vehicle_price']:
            raise ValueError('Loan amount cannot be greater than vehicle price')
        return v

class LoanApplicationCreate(LoanApplicationBase):
    user_id: Optional[int] = None
    primary_borrower: Optional[BorrowerBase] = None
    co_borrower: Optional[BorrowerBase] = None
    vehicle_details: Optional[VehicleDetailsBase] = None
    down_payment: Optional[float] = None
    term_years: Optional[int] = None
    interest_rate: Optional[float] = None

class LoanApplicationUpdate(BaseModel):
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    vehicle_price: Optional[float] = None
    loan_amount: Optional[float] = None
    loan_term_months: Optional[int] = None
    status: Optional[LoanStatus] = None
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None

class LoanApplicationSummary(BaseModel):
    id: int
    application_number: str
    customer_name: str
    status: LoanStatus
    created_at: datetime
    loan_amount: float

    model_config = {"from_attributes": True}

class LoanApplication(LoanApplicationBase):
    id: int
    application_number: str
    user_id: int
    status: LoanStatus
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class LoanApplicationResponse(BaseModel):
    id: int
    application_number: str
    status: LoanStatus
    loan_amount: float
    term_years: Optional[int] = None
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    down_payment: Optional[float] = None
    loan_to_value: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class LoanApplicationDetail(LoanApplication):
    user: Optional[User] = None
    documents: List[Document] = []
    timeline: List[TimelineEvent] = []
    borrowers: List[BorrowerResponse] = []
    vehicle_details: Optional[VehicleDetailsResponse] = None
    notes: List[NoteResponse] = []

    model_config = {"from_attributes": True}

# Authority level schema
class AuthorityLevelUpdate(BaseModel):
    lending_authority_level: int = Field(..., ge=1, le=8)

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    is_admin: Optional[bool] = False

# Update forward references
LoanApplicationDetail.update_forward_refs()