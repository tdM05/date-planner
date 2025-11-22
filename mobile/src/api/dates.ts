import apiClient from './client';
import { ENDPOINTS } from '../constants/config';
import { DateGenerationRequest, DatePlanResponse } from '../types';

export const datesAPI = {
  /**
   * Generate AI-powered couple date plan
   * Requires both users to have Google Calendar connected
   */
  generateCoupleDatePlan: async (data: DateGenerationRequest): Promise<DatePlanResponse> => {
    const response = await apiClient.post<DatePlanResponse>(
      ENDPOINTS.DATES_GENERATE,
      data,
      {
        timeout: 90000, // 90 seconds - AI generation can take time
      }
    );
    return response.data;
  },
};
