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

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  description: string;
}

export interface GetEventsResponse {
  events: CalendarEvent[];
  user_name: string;
}

export interface FreeSlot {
  start: string;
  end: string;
  duration_hours: number;
}

export interface GetFreeSlotsResponse {
  free_slots: FreeSlot[];
  time_frame_start: string;
  time_frame_end: string;
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

  /**
   * Get the current user's calendar events
   */
  getMyEvents: async (startDate: string, endDate: string): Promise<GetEventsResponse> => {
    const response = await apiClient.get<GetEventsResponse>(
      '/calendar/my-events',
      { params: { start_date: startDate, end_date: endDate } }
    );
    return response.data;
  },

  /**
   * Get the partner's calendar events
   */
  getPartnerEvents: async (startDate: string, endDate: string): Promise<GetEventsResponse> => {
    const response = await apiClient.get<GetEventsResponse>(
      '/calendar/partner-events',
      { params: { start_date: startDate, end_date: endDate } }
    );
    return response.data;
  },

  /**
   * Get mutual free time slots
   */
  getFreeSlots: async (
    startDate: string,
    endDate: string,
    minDurationHours: number = 2.0
  ): Promise<GetFreeSlotsResponse> => {
    const response = await apiClient.get<GetFreeSlotsResponse>(
      '/calendar/free-slots',
      { params: { start_date: startDate, end_date: endDate, min_duration_hours: minDurationHours } }
    );
    return response.data;
  },
};
