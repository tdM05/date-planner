import apiClient from './client';
import { ENDPOINTS } from '../constants/config';
import {
  InvitationRequest,
  InvitationResponse,
  AcceptInvitationRequest,
  CoupleResponse,
  Partner,
} from '../types';

export const couplesAPI = {
  /**
   * Create and send a couple invitation
   */
  invitePartner: async (data: InvitationRequest): Promise<InvitationResponse> => {
    const response = await apiClient.post<InvitationResponse>(
      ENDPOINTS.COUPLES_INVITE,
      data
    );
    return response.data;
  },

  /**
   * Accept a couple invitation
   */
  acceptInvitation: async (data: AcceptInvitationRequest): Promise<CoupleResponse> => {
    const response = await apiClient.post<CoupleResponse>(
      ENDPOINTS.COUPLES_ACCEPT,
      data
    );
    return response.data;
  },

  /**
   * Get partner information
   */
  getPartner: async (): Promise<Partner> => {
    const response = await apiClient.get<Partner>(ENDPOINTS.COUPLES_PARTNER);
    return response.data;
  },
};
