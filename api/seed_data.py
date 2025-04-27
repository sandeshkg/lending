#!/usr/bin/env python3
"""
Database seeding script for the lending API.
Populates the database with sample loan applications and related data.
"""
import sys
import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid
import json
from typing import List

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import SessionLocal, engine, Base
from app.models.models import User, LoanApplication, Document, TimelineEvent, LoanStatus, TimelineEventType, DocumentStatus

# Check if the models with Borrower and VehicleDetails exist
borrower_model_exists = False
try:
    from app.models.models import Borrower, VehicleDetails, Note
    borrower_model_exists = True
except ImportError:
    # Create these models locally for the script if they don't exist in the models module
    from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Enum, Text
    from sqlalchemy.ext.declarative import declarative_base
    from app.database.db import Base
    
    class Borrower(Base):
        __tablename__ = "borrowers"
        
        id = Column(Integer, primary_key=True, index=True)
        loan_id = Column(Integer, ForeignKey("loan_applications.id"))
        is_co_borrower = Column(Boolean, default=False)
        full_name = Column(String)
        email = Column(String)
        phone = Column(String)
        credit_score = Column(Integer)
        annual_income = Column(Float)
        employment_status = Column(String)
        employer = Column(String)
        years_at_job = Column(Float)
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    class VehicleDetails(Base):
        __tablename__ = "vehicle_details"
        
        id = Column(Integer, primary_key=True, index=True)
        loan_id = Column(Integer, ForeignKey("loan_applications.id"))
        make = Column(String)
        model = Column(String)
        year = Column(Integer)
        vin = Column(String)
        color = Column(String)
        mileage = Column(Integer)
        condition = Column(String)
        vehicle_value = Column(Float)
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    class Note(Base):
        __tablename__ = "notes"
        
        id = Column(Integer, primary_key=True, index=True)
        loan_id = Column(Integer, ForeignKey("loan_applications.id"))
        author = Column(String)
        content = Column(Text)
        created_at = Column(DateTime, default=datetime.utcnow)

    # Create these additional tables in the database
    print("Creating additional tables (borrowers, vehicle_details, notes)...")
    Base.metadata.create_all(bind=engine, tables=[Borrower.__table__, VehicleDetails.__table__, Note.__table__])

# Sample data
VEHICLE_MAKES = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes-Benz", "Audi", "Tesla", "Hyundai"]
VEHICLE_MODELS = {
    "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma"],
    "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey"],
    "Ford": ["F-150", "Escape", "Explorer", "Mustang", "Edge"],
    "Chevrolet": ["Silverado", "Equinox", "Traverse", "Malibu", "Tahoe"],
    "Nissan": ["Altima", "Rogue", "Sentra", "Pathfinder", "Frontier"],
    "BMW": ["3 Series", "5 Series", "X3", "X5", "7 Series"],
    "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "S-Class", "GLE"],
    "Audi": ["A4", "Q5", "A6", "Q7", "A3"],
    "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
    "Hyundai": ["Elantra", "Tucson", "Santa Fe", "Sonata", "Palisade"]
}
VEHICLE_COLORS = ["Black", "White", "Silver", "Gray", "Blue", "Red", "Green", "Brown", "Gold", "Yellow"]
VEHICLE_CONDITIONS = ["New", "Excellent", "Good", "Fair", "Poor"]
EMPLOYMENT_STATUSES = ["Employed", "Self-Employed", "Retired", "Part-Time", "Unemployed"]
EMPLOYERS = ["Tech Solutions Inc.", "Healthcare Systems LLC", "Education First", "Government Agency", 
             "Retail Consolidated", "Manufacturing Co.", "Financial Services Group", "Hospitality International",
             "Construction Management", "Transportation Services"]
FIRST_NAMES = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Robert", "Lisa", "William", "Jennifer",
               "James", "Linda", "Richard", "Patricia", "Mary", "Elizabeth", "Thomas", "Susan", "Charles", "Jessica"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
              "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"]
NOTE_CONTENTS = [
    "Applicant has excellent credit history. Approval recommended.",
    "Vehicle inspection completed. No issues found.",
    "Credit check shows previous bankruptcy. Recommend additional review.",
    "Income verification shows applicant meets requirements.",
    "Applicant requested lower interest rate. Manager approval needed.",
    "Co-signer has strong credit profile.",
    "Vehicle history report shows clean title and no accidents.",
    "Employment verification completed successfully.",
    "Down payment received and confirmed.",
    "Insurance verification pending."
]
NOTE_AUTHORS = ["Sarah Johnson", "Michael Thompson", "David Wilson", "Emily Davis", "Robert Brown"]

def generate_application_number():
    """Generate a unique application number"""
    current_year = 2025  # Current year
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"LA-{current_year}-{unique_id}"

def generate_phone_number():
    """Generate a random US phone number"""
    return f"({random.randint(100, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}"

def generate_vin():
    """Generate a random VIN number"""
    characters = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
    return ''.join(random.choice(characters) for _ in range(17))

def generate_email(full_name):
    """Generate an email based on the full name"""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "aol.com", "hotmail.com", "example.com"]
    name_parts = full_name.lower().replace(" ", ".")
    return f"{name_parts}@{random.choice(domains)}"

def create_sample_admin_user(db: Session):
    """Create a sample admin user if it doesn't exist"""
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    
    if not admin_user:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        admin_user = User(
            email="admin@example.com",
            hashed_password=pwd_context.hash("adminpassword"),
            full_name="Admin User",
            is_active=True,
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("Admin user created")
    
    return admin_user

def create_sample_regular_user(db: Session):
    """Create a sample regular user if it doesn't exist"""
    user_email = "user@example.com"
    regular_user = db.query(User).filter(User.email == user_email).first()
    
    if not regular_user:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        regular_user = User(
            email=user_email,
            hashed_password=pwd_context.hash("userpassword"),
            full_name="Regular User",
            is_active=True,
            is_admin=False
        )
        db.add(regular_user)
        db.commit()
        db.refresh(regular_user)
        print("Regular user created")
    
    return regular_user

def create_loan_application(db: Session, user_id: int, status: LoanStatus = None):
    """Create a sample loan application with related data"""
    # 1. Generate vehicle details
    vehicle_make = random.choice(VEHICLE_MAKES)
    vehicle_model = random.choice(VEHICLE_MODELS[vehicle_make])
    vehicle_year = random.randint(2015, 2025)
    vehicle_price = round(random.uniform(15000, 60000), 2)
    loan_amount = round(vehicle_price * random.uniform(0.7, 0.9), 2)  # 70-90% of vehicle value
    interest_rate = round(random.uniform(3.5, 7.5), 2)
    term_years = random.choice([3, 4, 5, 6, 7])
    loan_term_months = term_years * 12
    
    # Calculate monthly payment (simplified)
    r = interest_rate / 100 / 12  # Monthly interest rate
    n = loan_term_months  # Total number of payments
    monthly_payment = round(loan_amount * r * (1 + r) ** n / ((1 + r) ** n - 1), 2)
    
    # Set random status or use provided status
    if not status:
        status = random.choice(list(LoanStatus))
    
    # 2. Create the loan application
    application = LoanApplication(
        application_number=generate_application_number(),
        user_id=user_id,
        vehicle_make=vehicle_make,
        vehicle_model=vehicle_model,
        vehicle_year=vehicle_year,
        vehicle_price=vehicle_price,
        status=status,
        loan_amount=loan_amount,
        loan_term_months=loan_term_months,
        interest_rate=interest_rate,
        monthly_payment=monthly_payment
    )
    db.add(application)
    db.flush()  # Flush to get the ID for relationships
    
    # 3. Create primary borrower
    full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    primary_borrower = Borrower(
        loan_id=application.id,
        is_co_borrower=False,
        full_name=full_name,
        email=generate_email(full_name),
        phone=generate_phone_number(),
        credit_score=random.randint(580, 820),
        annual_income=round(random.uniform(40000, 150000), 2),
        employment_status=random.choice(EMPLOYMENT_STATUSES),
        employer=random.choice(EMPLOYERS),
        years_at_job=round(random.uniform(0.5, 20), 1)
    )
    db.add(primary_borrower)
    
    # 4. Add co-borrower for some loans (50% chance)
    if random.choice([True, False]):
        co_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        co_borrower = Borrower(
            loan_id=application.id,
            is_co_borrower=True,
            full_name=co_name,
            email=generate_email(co_name),
            phone=generate_phone_number(),
            credit_score=random.randint(580, 820),
            annual_income=round(random.uniform(30000, 120000), 2),
            employment_status=random.choice(EMPLOYMENT_STATUSES),
            employer=random.choice(EMPLOYERS),
            years_at_job=round(random.uniform(0.5, 15), 1)
        )
        db.add(co_borrower)
    
    # 5. Create vehicle details
    vehicle = VehicleDetails(
        loan_id=application.id,
        make=vehicle_make,
        model=vehicle_model,
        year=vehicle_year,
        vin=generate_vin(),
        color=random.choice(VEHICLE_COLORS),
        mileage=random.randint(0, 80000),
        condition=random.choice(VEHICLE_CONDITIONS),
        vehicle_value=vehicle_price
    )
    db.add(vehicle)
    
    # 6. Add timeline events based on status
    # Application submission
    created_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
    application.created_at = created_date
    application.updated_at = created_date
    
    submission_event = TimelineEvent(
        loan_id=application.id,
        event="Loan application submitted",
        user="System",
        type=TimelineEventType.INFO,
        created_at=created_date
    )
    db.add(submission_event)
    
    # Add additional timeline events based on status
    if status != LoanStatus.PENDING:
        review_date = created_date + timedelta(days=random.randint(1, 3))
        review_event = TimelineEvent(
            loan_id=application.id,
            event="Application review started",
            user=random.choice(NOTE_AUTHORS),
            type=TimelineEventType.INFO,
            created_at=review_date
        )
        db.add(review_event)
        
        if status in [LoanStatus.APPROVED, LoanStatus.REJECTED, LoanStatus.FUNDED, LoanStatus.CLOSED]:
            decision_date = review_date + timedelta(days=random.randint(1, 5))
            event_type = TimelineEventType.SUCCESS if status != LoanStatus.REJECTED else TimelineEventType.ERROR
            decision_event = TimelineEvent(
                loan_id=application.id,
                event=f"Application {status.value}",
                user=random.choice(NOTE_AUTHORS),
                type=event_type,
                created_at=decision_date
            )
            db.add(decision_event)
            application.updated_at = decision_date
            
            if status == LoanStatus.FUNDED:
                funded_date = decision_date + timedelta(days=random.randint(2, 7))
                funded_event = TimelineEvent(
                    loan_id=application.id,
                    event="Loan funds disbursed",
                    user=random.choice(NOTE_AUTHORS),
                    type=TimelineEventType.SUCCESS,
                    created_at=funded_date
                )
                db.add(funded_event)
                application.updated_at = funded_date
                
            if status == LoanStatus.CLOSED:
                closed_date = decision_date + timedelta(days=random.randint(30, 60))
                closed_event = TimelineEvent(
                    loan_id=application.id,
                    event="Loan closed",
                    user="System",
                    type=TimelineEventType.INFO,
                    created_at=closed_date
                )
                db.add(closed_event)
                application.updated_at = closed_date
    
    # 7. Add some notes (1-3 random notes)
    for _ in range(random.randint(1, 3)):
        note_date = created_date + timedelta(days=random.randint(0, 10))
        note = Note(
            loan_id=application.id,
            author=random.choice(NOTE_AUTHORS),
            content=random.choice(NOTE_CONTENTS),
            created_at=note_date
        )
        db.add(note)
    
    # 8. Add documents (2-5 random documents)
    document_types = ["Driver's License", "Proof of Insurance", "Pay Stubs", "Bank Statements", 
                     "Vehicle Title", "Purchase Agreement", "Credit Report"]
    
    for _ in range(random.randint(2, 5)):
        doc_type = random.choice(document_types)
        document_types.remove(doc_type)  # Remove to avoid duplicates
        
        doc_status = random.choice(list(DocumentStatus))
        if status == LoanStatus.APPROVED:
            doc_status = DocumentStatus.APPROVED
        
        document = Document(
            loan_id=application.id,
            name=doc_type,
            file_path=f"uploads/loan_{application.id}/{doc_type.lower().replace(' ', '_')}.pdf",
            status=doc_status,
            created_at=created_date + timedelta(days=random.randint(0, 5))
        )
        db.add(document)
        
        if len(document_types) == 0:
            break
    
    return application

def seed_database():
    """Main function to seed the database with sample data"""
    db = SessionLocal()
    try:
        # Create users if they don't exist
        admin_user = create_sample_admin_user(db)
        regular_user = create_sample_regular_user(db)
        
        # Check how many loan applications already exist
        existing_count = db.query(LoanApplication).count()
        if existing_count > 0:
            print(f"{existing_count} loan applications already exist. Do you want to add more? (y/n)")
            response = input().strip().lower()
            if response != 'y':
                print("Database seeding cancelled.")
                return
        
        # Create loan applications with different statuses
        print("Creating sample loan applications...")
        
        # Create at least one of each status
        for status in LoanStatus:
            app = create_loan_application(db, regular_user.id, status)
            print(f"Created application {app.application_number} with status {status.value}")
        
        # Create some additional random applications
        for _ in range(10):
            app = create_loan_application(db, regular_user.id)
            print(f"Created application {app.application_number} with status {app.status.value}")
        
        db.commit()
        print("Database seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()