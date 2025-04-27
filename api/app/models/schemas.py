from pydantic import BaseModel, EmailStr, Field, validator
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

    class Config:
        orm_mode = True

# Add the missing UserResponse schema used in the users.py router
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

# Add the missing DocumentResponse schema used in the documents.py router
class DocumentResponse(Document):
    """Response model for document endpoints"""
    
    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

class TimelineEventResponse(TimelineEventBase):
    id: int
    loan_id: int
    created_at: datetime

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

# Loan application schemas
class LoanApplicationBase(BaseModel):
    vehicle_make: str
    vehicle_model: str
    vehicle_year: int = Field(..., ge=1900, le=2100)
    vehicle_price: float = Field(..., gt=0)
    loan_amount: float = Field(..., gt=0)
    loan_term_months: int = Field(..., ge=12, le=84)

    @validator('loan_amount')
    def validate_loan_amount(cls, v, values):
        if 'vehicle_price' in values and v > values['vehicle_price']:
            raise ValueError('Loan amount cannot be greater than vehicle price')
        return v

class LoanApplicationCreate(LoanApplicationBase):
    pass

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

    class Config:
        orm_mode = True

class LoanApplication(LoanApplicationBase):
    id: int
    application_number: str
    user_id: int
    status: LoanStatus
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

class LoanApplicationDetail(LoanApplication):
    user: User
    documents: List["Document"] = []
    timeline: List["TimelineEvent"] = []

    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    is_admin: Optional[bool] = False

# Update forward references
LoanApplicationDetail.update_forward_refs()