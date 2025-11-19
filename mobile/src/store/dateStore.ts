import { create } from 'zustand';
import { DatePlanResponse, DateGenerationRequest } from '../types';
import { datesAPI } from '../api';

interface DateState {
  // State
  datePlan: DatePlanResponse | null;
  isGenerating: boolean;
  error: string | null;
  lastRequest: DateGenerationRequest | null;

  // Actions
  generateDatePlan: (request: DateGenerationRequest) => Promise<void>;
  clearDatePlan: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useDateStore = create<DateState>((set, get) => ({
  // Initial state
  datePlan: null,
  isGenerating: false,
  error: null,
  lastRequest: null,

  // Generate date plan
  generateDatePlan: async (request: DateGenerationRequest) => {
    try {
      set({ isGenerating: true, error: null, lastRequest: request });
      const datePlan = await datesAPI.generateCoupleDatePlan(request);
      set({ datePlan });
    } catch (error: any) {
      let errorMessage = 'Failed to generate date plan';

      // Handle specific error cases
      if (error.status === 428) {
        errorMessage = 'Please connect your Google Calendar first';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Invalid request. Please check your inputs.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },

  // Clear date plan
  clearDatePlan: () => {
    set({ datePlan: null, lastRequest: null, error: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store (on logout)
  reset: () => {
    set({
      datePlan: null,
      lastRequest: null,
      error: null,
    });
  },
}));
