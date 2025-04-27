from app.database.db import Base, engine, SessionLocal
from app.models.models import User
from passlib.context import CryptContext

# Create the password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    """
    Initialize the database tables and create an admin user
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create admin user if it doesn't exist
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    
    if not admin_user:
        admin_user = User(
            email="admin@example.com",
            hashed_password=pwd_context.hash("adminpassword"),
            full_name="Admin User",
            is_active=True,
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
    
    db.close()

# Add the create_tables function that was imported in main.py
def create_tables():
    """
    Create database tables and initialize data
    This function exists to match the import in main.py
    """
    init_db()