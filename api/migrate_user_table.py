#!/usr/bin/env python3
"""
Migration script to add lending_authority_level column to the users table.
SQLite doesn't support ALTER TABLE ADD COLUMN with constraints,
so we need to recreate the table with the new schema.
"""
import sys
import os
import sqlite3
from datetime import datetime

# Add the parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database file path
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lending.db")

def migrate_users_table():
    """Migrate the users table to add lending_authority_level column"""
    print("Starting user table migration...")
    
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Begin transaction
        conn.execute("BEGIN TRANSACTION")
        
        # 1. Retrieve all existing user data
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        
        # Get column names from the current users table
        cursor.execute("PRAGMA table_info(users)")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        
        print(f"Found {len(users)} users to migrate")
        print(f"Current columns: {', '.join(column_names)}")
        
        # 2. Create a temporary table with the new schema
        cursor.execute("""
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY,
            email VARCHAR NOT NULL,
            hashed_password VARCHAR NOT NULL,
            full_name VARCHAR NOT NULL,
            is_active BOOLEAN NOT NULL,
            is_admin BOOLEAN NOT NULL,
            lending_authority_level INTEGER DEFAULT 1 NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
        """)
        
        # 3. Insert data from old table to new table with default lending_authority_level=1
        for user in users:
            # Create a dictionary to map column names to values
            user_dict = dict(zip(column_names, user))
            
            cursor.execute("""
            INSERT INTO users_new (
                id, email, hashed_password, full_name, 
                is_active, is_admin, lending_authority_level, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_dict['id'],
                user_dict['email'],
                user_dict['hashed_password'],
                user_dict['full_name'],
                user_dict['is_active'],
                user_dict['is_admin'],
                1,  # Default lending_authority_level
                user_dict['created_at'],
                user_dict['updated_at']
            ))
        
        # 4. Drop the old table
        cursor.execute("DROP TABLE users")
        
        # 5. Rename the new table to the original name
        cursor.execute("ALTER TABLE users_new RENAME TO users")
        
        # 6. Create any necessary indexes
        cursor.execute("CREATE UNIQUE INDEX ix_users_email ON users(email)")
        cursor.execute("CREATE INDEX ix_users_id ON users(id)")
        
        # Commit the transaction
        conn.commit()
        print("Migration completed successfully! The lending_authority_level column has been added.")
        
    except Exception as e:
        # Rollback in case of error
        conn.rollback()
        print(f"Error during migration: {str(e)}")
        raise
    finally:
        # Close the connection
        conn.close()

if __name__ == "__main__":
    migrate_users_table()