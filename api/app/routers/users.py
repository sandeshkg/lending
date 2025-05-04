from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.database.db import get_db
from app.models import models, schemas

# Security configurations
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # Should be stored securely
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(db, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Add a helper function to get a default user for testing without authentication
async def get_default_test_user(db: Session = Depends(get_db)):
    """For testing only: returns a default user without requiring authentication"""
    # Try to get the first user from the database
    user = db.query(models.User).first()
    
    # If no user exists, create a default one
    if not user:
        hashed_password = get_password_hash("testpassword")
        user = models.User(
            email="test@example.com",
            hashed_password=hashed_password,
            full_name="Test User",
            is_active=True,
            lending_authority_level=3  # Set a default authority level
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

# Routes
@router.post("/token", response_model=dict)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user
    """
    # Check if email already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(db: Session = Depends(get_db)):
    """
    Get current user information - TESTING MODE: No authentication required
    """
    # For testing purposes, we're using a default user instead of requiring authentication
    user = await get_default_test_user(db)
    return user

@router.get("/", response_model=List[schemas.UserResponse])
async def read_users(
    skip: int = 0, 
    limit: int = 100,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all users (admin only)
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.patch("/authority-level", response_model=schemas.UserResponse)
async def update_lending_authority_level(
    authority_data: schemas.AuthorityLevelUpdate,
    db: Session = Depends(get_db)
):
    """
    Update user's lending authority level (1-8) - TESTING MODE: No authentication required
    """
    # Validate the authority level is within acceptable range (1-8)
    if authority_data.lending_authority_level < 1 or authority_data.lending_authority_level > 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lending authority level must be between 1 and 8"
        )
    
    # For testing purposes, we're using a default user instead of requiring authentication
    user = await get_default_test_user(db)
    
    # Update the user's lending authority level
    user.lending_authority_level = authority_data.lending_authority_level
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user