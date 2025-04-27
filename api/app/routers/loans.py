from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import uuid

from app.database.db import get_db
from app.models import models, schemas

router = APIRouter()

# Helper function to generate application number
def generate_application_number():
    current_year = 2025  # Hardcoded for demo, would use datetime in production
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"LA-{current_year}-{unique_id}"

@router.get("/", response_model=List[schemas.LoanApplicationSummary])
def get_loan_applications(
    status: Optional[models.LoanStatus] = None,
    search: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all loan applications with optional filtering
    """
    query = db.query(models.LoanApplication)
    
    # Apply filters if provided
    if status:
        query = query.filter(models.LoanApplication.status == status)
    
    if search:
        # Join with borrower to search by customer name
        query = query.join(models.Borrower).filter(
            models.Borrower.is_co_borrower == False,  # Only primary borrowers
            models.Borrower.full_name.ilike(f"%{search}%") |
            models.LoanApplication.application_number.ilike(f"%{search}%")
        )
    
    loans = query.offset(skip).limit(limit).all()
    
    # Format response with primary borrower name
    result = []
    for loan in loans:
        primary_borrower = next((b for b in loan.borrowers if not b.is_co_borrower), None)
        customer_name = primary_borrower.full_name if primary_borrower else "Unknown"
        
        result.append(schemas.LoanApplicationSummary(
            id=loan.id,
            application_number=loan.application_number,
            customer_name=customer_name,
            status=loan.status,
            created_at=loan.created_at,  # Changed from submitted_date to created_at
            loan_amount=loan.loan_amount
        ))
    
    return result

@router.post("/", response_model=schemas.LoanApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_loan_application(
    loan_application: schemas.LoanApplicationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new loan application
    """
    # Create loan application
    db_loan = models.LoanApplication(
        application_number=generate_application_number(),
        status=models.LoanStatus.PENDING,
        vehicle_make=loan_application.vehicle_make,
        vehicle_model=loan_application.vehicle_model,
        vehicle_year=loan_application.vehicle_year,
        vehicle_price=loan_application.vehicle_price,
        loan_amount=loan_application.loan_amount,
        loan_term_months=loan_application.loan_term_months,
        user_id=loan_application.user_id if hasattr(loan_application, 'user_id') else None,
    )
    db.add(db_loan)
    
    # Add timeline event for application creation
    if db_loan.id:
        timeline_event = models.TimelineEvent(
            loan_id=db_loan.id,
            event="Loan application submitted",
            user="System",
            type=models.TimelineEventType.INFO
        )
        db.add(timeline_event)
    
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.get("/{application_id}", response_model=schemas.LoanApplicationDetail)
def get_loan_application(
    application_id: str, 
    db: Session = Depends(get_db)
):
    """
    Get a specific loan application by ID or application number
    """
    # Try to get by ID first (if numeric)
    if application_id.isdigit():
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(application_id)
        ).first()
    else:
        # Try to get by application number
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == application_id
        ).first()
    
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    return db_loan

@router.put("/{application_id}", response_model=schemas.LoanApplicationResponse)
def update_loan_application(
    application_id: str,
    loan_update: schemas.LoanApplicationUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a loan application
    """
    # Find loan by ID or application number
    if application_id.isdigit():
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(application_id)
        ).first()
    else:
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == application_id
        ).first()
    
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    # Update loan attributes
    update_data = loan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_loan, key, value)
    
    # Add timeline event for status change if status was updated
    if loan_update.status is not None and loan_update.status != db_loan.status:
        timeline_event = models.TimelineEvent(
            loan_id=db_loan.id,
            event=f"Loan status changed to {loan_update.status.value}",
            user="System",  # Would use authenticated user in production
            type=models.TimelineEventType.INFO
        )
        db.add(timeline_event)
    
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.post("/{application_id}/notes", response_model=schemas.NoteResponse)
def add_note(
    application_id: str,
    note: schemas.NoteCreate,
    db: Session = Depends(get_db)
):
    """
    Add a note to a loan application
    """
    # Find loan
    if application_id.isdigit():
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(application_id)
        ).first()
    else:
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == application_id
        ).first()
    
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    # Create note
    db_note = models.Note(
        loan_id=db_loan.id,
        author=note.author,
        content=note.content
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.post("/{application_id}/timeline", response_model=schemas.TimelineEventResponse)
def add_timeline_event(
    application_id: str,
    event: schemas.TimelineEventCreate,
    db: Session = Depends(get_db)
):
    """
    Add a timeline event to a loan application
    """
    # Find loan
    if application_id.isdigit():
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(application_id)
        ).first()
    else:
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == application_id
        ).first()
    
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    # Create timeline event
    db_event = models.TimelineEvent(
        loan_id=db_loan.id,
        event=event.event,
        user=event.user,
        type=event.type
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return db_event

# New endpoints for borrowers and vehicle details
@router.get("/{application_id}/borrowers", response_model=List[schemas.BorrowerResponse])
def get_loan_borrowers(
    application_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all borrowers for a loan application
    """
    # Find loan
    if application_id.isdigit():
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(application_id)
        ).first()
    else:
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == application_id
        ).first()
    
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    return db_loan.borrowers

@router.get("/{application_id}/vehicle", response_model=schemas.VehicleDetailsResponse)
def get_loan_vehicle_details(
    application_id: str,
    db: Session = Depends(get_db)
):
    """
    Get vehicle details for a loan application
    """
    # Find loan
    if application_id.isdigit():
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(application_id)
        ).first()
    else:
        db_loan = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == application_id
        ).first()
    
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    if db_loan.vehicle_details is None:
        raise HTTPException(status_code=404, detail="Vehicle details not found")
    
    return db_loan.vehicle_details