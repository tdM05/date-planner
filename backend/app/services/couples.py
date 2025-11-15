"""
Couples service for managing couple relationships and invitations.
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
import secrets

from app.clients.db import get_db
from app.core.models import (
    Couple,
    CoupleResponse,
    Invitation,
    InvitationResponse,
    UserResponse
)
from ._base import AbstractService


class CouplesService(AbstractService):
    """Service for handling couple invitations and relationships."""

    def __init__(self):
        self.db = get_db()

    def create_invitation(
        self,
        inviter_id: UUID,
        invitee_email: str
    ) -> InvitationResponse:
        """
        Create a new couple invitation.

        Args:
            inviter_id: UUID of user creating the invitation
            invitee_email: Email of user being invited

        Returns:
            InvitationResponse with invitation details

        Raises:
            ValueError: If inviter already has a partner or invitation exists
        """
        # Check if inviter already has a partner
        existing_couple = self._get_couple_by_user_id(inviter_id)
        if existing_couple:
            raise ValueError("You are already in a couple")

        # Check if inviter is inviting themselves
        inviter = self.db.table('users').select('email').eq('id', str(inviter_id)).execute()
        if inviter.data and inviter.data[0]['email'] == invitee_email:
            raise ValueError("You cannot invite yourself")

        # Check for existing pending invitation between these users
        existing_invitation = self.db.table('invitations')\
            .select('*')\
            .eq('inviter_id', str(inviter_id))\
            .eq('invitee_email', invitee_email)\
            .eq('status', 'pending')\
            .execute()

        if existing_invitation.data:
            # Return existing invitation
            inv = existing_invitation.data[0]
            return InvitationResponse(
                invitation_id=inv['id'],
                invitee_email=inv['invitee_email'],
                token=inv['token'],
                expires_at=inv['expires_at']
            )

        # Generate unique invitation token
        token = secrets.token_urlsafe(32)

        # Set expiration (7 days from now)
        expires_at = datetime.utcnow() + timedelta(days=7)

        # Create invitation in database
        new_invitation = {
            'inviter_id': str(inviter_id),
            'invitee_email': invitee_email,
            'token': token,
            'status': 'pending',
            'expires_at': expires_at.isoformat()
        }

        result = self.db.table('invitations').insert(new_invitation).execute()
        invitation_data = result.data[0]

        return InvitationResponse(
            invitation_id=invitation_data['id'],
            invitee_email=invitation_data['invitee_email'],
            token=invitation_data['token'],
            expires_at=invitation_data['expires_at']
        )

    def accept_invitation(
        self,
        token: str,
        accepter_id: UUID
    ) -> CoupleResponse:
        """
        Accept a couple invitation and create the couple relationship.

        Args:
            token: Invitation token
            accepter_id: UUID of user accepting the invitation

        Returns:
            CoupleResponse with couple details

        Raises:
            ValueError: If invitation is invalid, expired, or accepter already has partner
        """
        # Find invitation by token
        result = self.db.table('invitations')\
            .select('*')\
            .eq('token', token)\
            .execute()

        if not result.data:
            raise ValueError("Invalid invitation token")

        invitation = result.data[0]

        # Check if invitation is already accepted or expired
        if invitation['status'] != 'pending':
            raise ValueError("Invitation has already been used")

        # Check if invitation has expired
        expires_at = datetime.fromisoformat(invitation['expires_at'].replace('Z', '+00:00'))
        if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
            # Mark as expired
            self.db.table('invitations')\
                .update({'status': 'expired'})\
                .eq('id', invitation['id'])\
                .execute()
            raise ValueError("Invitation has expired")

        # Verify accepter's email matches invitation
        accepter = self.db.table('users').select('*').eq('id', str(accepter_id)).execute()
        if not accepter.data:
            raise ValueError("User not found")

        accepter_email = accepter.data[0]['email']
        if accepter_email != invitation['invitee_email']:
            raise ValueError("This invitation is not for you")

        # Check if accepter already has a partner
        existing_couple = self._get_couple_by_user_id(accepter_id)
        if existing_couple:
            raise ValueError("You are already in a couple")

        # Check if inviter already has a partner (could have accepted another invitation)
        inviter_id = UUID(invitation['inviter_id'])
        inviter_couple = self._get_couple_by_user_id(inviter_id)
        if inviter_couple:
            raise ValueError("The person who invited you is already in a couple")

        # Create couple relationship
        new_couple = {
            'partner1_id': invitation['inviter_id'],
            'partner2_id': str(accepter_id)
        }

        couple_result = self.db.table('couples').insert(new_couple).execute()
        couple_data = couple_result.data[0]

        # Mark invitation as accepted
        self.db.table('invitations')\
            .update({'status': 'accepted'})\
            .eq('id', invitation['id'])\
            .execute()

        # Get partner (inviter) info
        inviter_data = self.db.table('users')\
            .select('*')\
            .eq('id', invitation['inviter_id'])\
            .execute()

        partner = inviter_data.data[0]

        return CoupleResponse(
            couple_id=couple_data['id'],
            partner=UserResponse(
                id=partner['id'],
                email=partner['email'],
                full_name=partner.get('full_name'),
                created_at=partner['created_at']
            ),
            created_at=couple_data['created_at']
        )

    def get_partner(self, user_id: UUID) -> Optional[CoupleResponse]:
        """
        Get partner information for a user.

        Args:
            user_id: UUID of the user

        Returns:
            CoupleResponse if user has a partner, None otherwise
        """
        couple = self._get_couple_by_user_id(user_id)
        if not couple:
            return None

        # Determine which partner is the other one
        partner_id = (
            couple['partner2_id']
            if couple['partner1_id'] == str(user_id)
            else couple['partner1_id']
        )

        # Get partner info
        partner_result = self.db.table('users').select('*').eq('id', partner_id).execute()
        if not partner_result.data:
            return None

        partner = partner_result.data[0]

        return CoupleResponse(
            couple_id=couple['id'],
            partner=UserResponse(
                id=partner['id'],
                email=partner['email'],
                full_name=partner.get('full_name'),
                created_at=partner['created_at']
            ),
            created_at=couple['created_at']
        )

    def _get_couple_by_user_id(self, user_id: UUID) -> Optional[dict]:
        """
        Find couple record by user ID (either partner1 or partner2).

        Args:
            user_id: UUID of the user

        Returns:
            Couple data if found, None otherwise
        """
        # Check if user is partner1
        result = self.db.table('couples')\
            .select('*')\
            .eq('partner1_id', str(user_id))\
            .execute()

        if result.data:
            return result.data[0]

        # Check if user is partner2
        result = self.db.table('couples')\
            .select('*')\
            .eq('partner2_id', str(user_id))\
            .execute()

        if result.data:
            return result.data[0]

        return None


def get_couples_service() -> CouplesService:
    """Dependency function to get CouplesService instance."""
    return CouplesService()
