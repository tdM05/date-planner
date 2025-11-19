// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  google_refresh_token?: string;
  created_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface GoogleOAuthResponse {
  authorization_url: string;
}

export interface CalendarStatus {
  user_calendar_connected: boolean;
  partner_calendar_connected: boolean | null;
  has_partner: boolean;
}

// Couples types
export interface Partner {
  id: string;
  email: string;
  full_name: string;
  google_refresh_token?: string;
}

export interface InvitationRequest {
  invitee_email: string;
}

export interface InvitationResponse {
  invitation_id: string;
  token: string;
  expires_at: string;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface CoupleResponse {
  couple_id: string;
  partner: Partner;
}

// Date generation types
export interface DateGenerationRequest {
  prompt: string;
  location: string;
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
}

export interface FreeTimeSlot {
  start: string; // ISO datetime
  end: string; // ISO datetime
  duration_hours: number;
}

export interface DateEvent {
  name: string;
  reason: string;
  suggested_time: string; // ISO datetime
  address?: string;
  place_id?: string;
}

export interface DatePlanResponse {
  events: DateEvent[];
  free_time_slots: FreeTimeSlot[];
}

// API Error types
export interface APIError {
  detail: string;
}
