import { create } from 'zustand';
import { DatePlanResponse, DateGenerationRequest } from '../types';
import { datesAPI } from '../api';

interface DatePlanHistoryItem {
  datePlan: DatePlanResponse;
  request: DateGenerationRequest;
  timestamp: string;
}

interface DateState {
  // State
  datePlan: DatePlanResponse | null;
  datePlanHistory: DatePlanHistoryItem[];
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
  datePlanHistory: [],
  isGenerating: false,
  error: null,
  lastRequest: null,

  // Generate date plan
  generateDatePlan: async (request: DateGenerationRequest) => {
    try {
      set({ isGenerating: true, error: null, lastRequest: request });
      const datePlan = await datesAPI.generateCoupleDatePlan(request);

      // Add to history (keep last 10 plans)
      const currentHistory = get().datePlanHistory;
      const newHistoryItem: DatePlanHistoryItem = {
        datePlan,
        request,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [newHistoryItem, ...currentHistory].slice(0, 10);

      set({ datePlan, datePlanHistory: updatedHistory });
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

  // Clear current date plan (but keep history)
  clearDatePlan: () => {
    set({ datePlan: null, lastRequest: null, error: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store (on logout) - clears everything including history
  reset: () => {
    set({
      datePlan: null,
      datePlanHistory: [],
      lastRequest: null,
      error: null,
    });
  },
}));
