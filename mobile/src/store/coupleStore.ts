import { create } from 'zustand';
import { Partner, InvitationResponse, CalendarStatus } from '../types';
import { couplesAPI, authAPI } from '../api';

interface CoupleState {
  // State
  partner: Partner | null;
  hasCouple: boolean;
  calendarStatus: CalendarStatus | null;
  invitation: InvitationResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPartner: () => Promise<void>;
  invitePartner: (email: string) => Promise<InvitationResponse>;
  acceptInvitation: (token: string) => Promise<void>;
  fetchCalendarStatus: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  // Initial state
  partner: null,
  hasCouple: false,
  calendarStatus: null,
  invitation: null,
  isLoading: false,
  error: null,

  // Fetch partner information
  fetchPartner: async () => {
    try {
      set({ isLoading: true, error: null });
      const partner = await couplesAPI.getPartner();
      set({ partner, hasCouple: true });
    } catch (error: any) {
      // 404 means no partner yet
      if (error.status === 404) {
        set({ partner: null, hasCouple: false });
      } else {
        set({ error: error.message || 'Failed to fetch partner' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Send partner invitation
  invitePartner: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const invitation = await couplesAPI.invitePartner({ invitee_email: email });
      set({ invitation });
      return invitation;
    } catch (error: any) {
      set({ error: error.message || 'Failed to send invitation' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Accept invitation
  acceptInvitation: async (token: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await couplesAPI.acceptInvitation({ token });
      set({
        partner: response.partner,
        hasCouple: true,
        invitation: null,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to accept invitation' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch calendar connection status
  fetchCalendarStatus: async () => {
    try {
      const status = await authAPI.getCalendarStatus();
      set({ calendarStatus: status });
    } catch (error: any) {
      console.error('Failed to fetch calendar status:', error);
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store (on logout)
  reset: () => {
    set({
      partner: null,
      hasCouple: false,
      calendarStatus: null,
      invitation: null,
      error: null,
    });
  },
}));
