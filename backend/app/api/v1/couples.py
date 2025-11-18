"""
Couples API endpoints for managing couple relationships and invitations.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.services.couples import get_couples_service, CouplesService
from app.core.models import (
    InvitationCreate,
    InvitationResponse,
    AcceptInvitationRequest,
    CoupleResponse,
    User
)
from app.core.dependencies import get_current_user


router = APIRouter()


@router.post("/invite", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def create_invitation(
    invitation_data: InvitationCreate,
    current_user: User = Depends(get_current_user),
    couples_service: CouplesService = Depends(get_couples_service)
):
    """
    Create an invitation to link with another user as a couple.

    Requires authentication. The invitee will receive the invitation token
    and can use it to accept the invitation.

    Args:
        invitation_data: Email of the user to invite
        current_user: Currently authenticated user (from JWT)
        couples_service: Couples service instance

    Returns:
        InvitationResponse with token and expiration details

    Raises:
        HTTPException: If user already has a partner or invitation fails
    """
    try:
        invitation = couples_service.create_invitation(
            inviter_id=current_user.id,
            invitee_email=invitation_data.invitee_email
        )
        return invitation
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create invitation: {str(e)}"
        )


@router.post("/accept", response_model=CoupleResponse)
def accept_invitation(
    accept_data: AcceptInvitationRequest,
    current_user: User = Depends(get_current_user),
    couples_service: CouplesService = Depends(get_couples_service)
):
    """
    Accept a couple invitation using the invitation token.

    Requires authentication. The authenticated user must be the invitee
    (their email must match the invitation's invitee_email).

    Args:
        accept_data: Invitation token to accept
        current_user: Currently authenticated user (from JWT)
        couples_service: Couples service instance

    Returns:
        CoupleResponse with couple details and partner information

    Raises:
        HTTPException: If token is invalid, expired, or acceptance fails
    """
    try:
        couple = couples_service.accept_invitation(
            token=accept_data.token,
            accepter_id=current_user.id
        )
        return couple
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept invitation: {str(e)}"
        )


@router.get("/partner", response_model=CoupleResponse)
def get_partner(
    current_user: User = Depends(get_current_user),
    couples_service: CouplesService = Depends(get_couples_service)
):
    """
    Get information about the current user's partner.

    Requires authentication. Returns partner details if the user is in a couple.

    Args:
        current_user: Currently authenticated user (from JWT)
        couples_service: Couples service instance

    Returns:
        CoupleResponse with partner information

    Raises:
        HTTPException: If user is not in a couple
    """
    partner_info = couples_service.get_partner(current_user.id)

    if not partner_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not currently in a couple"
        )

    return partner_info
