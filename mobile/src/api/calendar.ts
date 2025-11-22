import apiClient from './client';
import { ENDPOINTS } from '../constants/config';

export interface AddEventRequest {
  summary: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  location?: string;
  description?: string;
}

export interface AddEventResponse {
  success: boolean;
  event_id: string;
  event_link: string;
  message: string;
  added_to_partner_calendar?: boolean;
}

export const calendarAPI = {
  /**
   * Add an event to the user's Google Calendar
   */
  addEvent: async (eventData: AddEventRequest): Promise<AddEventResponse> => {
    const response = await apiClient.post<AddEventResponse>(
      '/calendar/add-event',
      eventData
    );
    return response.data;
  },
};
