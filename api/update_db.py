#!/usr/bin/env python3
"""
This script updates the database schema by creating any tables that don't exist.
Run this after modifying models to add new tables.
"""
import sys
import os

# Add the parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import engine
from app.models.models import Base, User, Borrower, VehicleDetails, Note

def update_database():
    print("Updating database schema...")
    # Create all tables that don't exist and update schema for existing tables
    Base.metadata.create_all(bind=engine)
    print("Database schema updated successfully!")

if __name__ == "__main__":
    update_database()