#!/usr/bin/env python3
"""
Simple script to reset a user's password in the database.
Usage: python reset_password.py <email> <new_password>
"""

import sys
from passlib.context import CryptContext
from app.clients.db import get_db
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def reset_password(email: str, new_password: str):
    """Reset password for a user."""
    db = get_db()

    # Check if user exists
    result = db.table('users').select('*').eq('email', email).execute()

    if not result.data:
        print(f"❌ User with email '{email}' not found!")
        return False

    # Hash new password
    new_hash = pwd_context.hash(new_password)

    # Update password
    update = db.table('users').update({
        'password_hash': new_hash
    }).eq('email', email).execute()

    if update.data:
        print(f"✅ Password reset successfully for {email}")
        print(f"   New password: {new_password}")
        return True
    else:
        print(f"❌ Failed to update password")
        return False


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <email> <new_password>")
        print("Example: python reset_password.py user@example.com newpassword123")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]

    if len(password) < 8:
        print("❌ Password must be at least 8 characters")
        sys.exit(1)

    reset_password(email, password)
