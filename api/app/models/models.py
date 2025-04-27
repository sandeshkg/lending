from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.database.db import Base

class LoanStatus(str, enum.Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    FUNDED = "funded"
    CLOSED = "closed"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    
class TimelineEventType(str, enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    loans = relationship("LoanApplication", back_populates="user")

class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vehicle_make = Column(String)
    vehicle_model = Column(String)
    vehicle_year = Column(Integer)
    vehicle_price = Column(Float)
    loan_amount = Column(Float)
    loan_term_months = Column(Integer)
    interest_rate = Column(Float, nullable=True)
    monthly_payment = Column(Float, nullable=True)
    status = Column(Enum(LoanStatus), default=LoanStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="loans")
    documents = relationship("Document", back_populates="loan")
    timeline = relationship("TimelineEvent", back_populates="loan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.application_number:
            self.application_number = f"LOAN-{uuid.uuid4().hex[:8].upper()}"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loan_applications.id"))
    name = Column(String)
    file_path = Column(String)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    loan = relationship("LoanApplication", back_populates="documents")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loan_applications.id"))
    event = Column(Text)
    user = Column(String)  # User who triggered the event
    type = Column(Enum(TimelineEventType), default=TimelineEventType.INFO)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    loan = relationship("LoanApplication", back_populates="timeline")