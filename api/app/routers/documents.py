from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Path
from sqlalchemy.orm import Session
import os
import shutil
from pathlib import Path as FilePath

from app.database.db import get_db
from app.models import models, schemas

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = FilePath("./uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/{loan_id}", response_model=List[schemas.DocumentResponse])
def get_documents(
    loan_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all documents for a loan application
    """
    # Find loan by ID or application number
    if loan_id.isdigit():
        query = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(loan_id)
        )
    else:
        query = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == loan_id
        )
    
    db_loan = query.first()
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    return db_loan.documents

@router.post("/{loan_id}/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    loan_id: str,
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document for a loan application
    """
    # Find loan by ID or application number
    if loan_id.isdigit():
        query = db.query(models.LoanApplication).filter(
            models.LoanApplication.id == int(loan_id)
        )
    else:
        query = db.query(models.LoanApplication).filter(
            models.LoanApplication.application_number == loan_id
        )
    
    db_loan = query.first()
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    # Create directory for loan documents if it doesn't exist
    loan_dir = UPLOAD_DIR / f"loan_{db_loan.id}"
    loan_dir.mkdir(exist_ok=True)
    
    # Save file to disk
    file_path = loan_dir / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create document record in database
    db_document = models.Document(
        loan_id=db_loan.id,
        name=name,
        file_path=str(file_path),
        status=models.DocumentStatus.PENDING
    )
    db.add(db_document)
    
    # Add timeline event for document upload
    timeline_event = models.TimelineEvent(
        loan_id=db_loan.id,
        event=f"Document '{name}' uploaded",
        user="System",
        type=models.TimelineEventType.INFO
    )
    db.add(timeline_event)
    
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.put("/{document_id}", response_model=schemas.DocumentResponse)
def update_document_status(
    document_id: int,
    document_update: schemas.DocumentUpdate,
    db: Session = Depends(get_db)
):
    """
    Update document status
    """
    db_document = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()
    
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update document attributes
    update_data = document_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_document, key, value)
    
    # Add timeline event for status change if status was updated
    if document_update.status is not None and document_update.status != db_document.status:
        timeline_event = models.TimelineEvent(
            loan_id=db_document.loan_id,
            event=f"Document '{db_document.name}' status changed to {document_update.status.value}",
            user="System",
            type=models.TimelineEventType.INFO
        )
        db.add(timeline_event)
    
    db.commit()
    db.refresh(db_document)
    
    return db_document