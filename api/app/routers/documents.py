from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Path, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import shutil
from pathlib import Path as FilePath
import datetime

from app.database.db import get_db
from app.models import models, schemas

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = FilePath("./uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/file/{document_id}", response_class=FileResponse)
def get_document_file(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the actual file for a document by ID
    """
    db_document = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()
    
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = FilePath(db_document.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    # Determine media type based on file extension
    file_extension = file_path.suffix.lower()
    media_type = "application/octet-stream"  # Default
    
    # Set appropriate content type for common file types
    if file_extension == ".pdf":
        media_type = "application/pdf"
    elif file_extension in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif file_extension == ".png":
        media_type = "image/png"
    elif file_extension in [".doc", ".docx"]:
        media_type = "application/msword"
    
    # Return with Content-Disposition: inline to display in browser
    return FileResponse(
        path=file_path, 
        filename=file_path.name,
        media_type=media_type,
        content_disposition_type="inline"  # This is the key change
    )

@router.get("/detail/{document_id}", response_model=schemas.DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a document by ID
    """
    db_document = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()
    
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return db_document

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
    
    # Create directory for loan documents using loan application number
    loan_dir = UPLOAD_DIR / db_loan.application_number
    loan_dir.mkdir(exist_ok=True)
    
    # Generate unique filename with timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{name.replace(' ', '_')}_{timestamp}_{file.filename}"
    file_path = loan_dir / filename
    
    # Save file to disk
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

@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a document by ID
    """
    db_document = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()
    
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get the file path to delete from filesystem
    file_path = FilePath(db_document.file_path)
    
    # Add timeline event for document deletion
    timeline_event = models.TimelineEvent(
        loan_id=db_document.loan_id,
        event=f"Document '{db_document.name}' was deleted",
        user="System",
        type=models.TimelineEventType.INFO
    )
    db.add(timeline_event)
    
    # Delete the file if it exists
    if file_path.exists():
        try:
            file_path.unlink()  # Delete the file
        except Exception as e:
            # Log the error but continue with database deletion
            print(f"Error deleting file: {e}")
    
    # Delete the document record from the database
    db.delete(db_document)
    db.commit()
    
    return None