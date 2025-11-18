"""
Utility functions for couple relationship management.
"""
from typing import Optional, Dict
from uuid import UUID

from app.clients.db import get_db


def get_user_couple(user_id: UUID) -> Optional[Dict]:
    """
    Get couple record for a user.

    Args:
        user_id: UUID of the user

    Returns:
        Dict with couple data if user is in a couple, None otherwise
        Couple dict contains: partner1_id, partner2_id, created_at
    """
    db = get_db()

    # Check if user is partner1
    result = (
        db.table("couples")
        .select("*")
        .eq("partner1_id", str(user_id))
        .execute()
    )

    if result.data:
        return result.data[0]

    # Check if user is partner2
    result = (
        db.table("couples")
        .select("*")
        .eq("partner2_id", str(user_id))
        .execute()
    )

    if result.data:
        return result.data[0]

    return None


def get_partner_id(user_id: UUID, couple: Dict) -> UUID:
    """
    Get the partner's ID from a couple record.

    Args:
        user_id: UUID of the current user
        couple: Couple dict containing partner1_id and partner2_id

    Returns:
        UUID of the partner
    """
    partner1_id = UUID(couple["partner1_id"])
    partner2_id = UUID(couple["partner2_id"])

    # Return the ID that's NOT the current user
    return partner2_id if partner1_id == user_id else partner1_id
