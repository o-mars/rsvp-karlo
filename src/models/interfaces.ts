import { Timestamp } from 'firebase/firestore';

export interface Event {
  id: string;
  name: string;
  startDateTime: Timestamp;
  endDateTime?: Timestamp;
  location: string;
  description?: string;
  eventSeriesId: string;
  eventSeriesAlias: string;
  createdAt: Timestamp;
  additionalFields?: Record<string, string>;
}

export interface EventSeries {
  id: string;
  name: string;
  alias: string;
  createdBy: string;
  createdAt: Timestamp;
  description?: string;
}

export interface SubGuest {
  id: string;
  firstName: string;
  lastName: string;
  rsvps: Record<string, string>;
  dietaryRestrictions?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  rsvps: Record<string, string>;
  subGuests: SubGuest[];
  dietaryRestrictions?: string;
  plusOne?: boolean;
}

export interface EventStats {
  totalGuests: number;
  invited: number;
  responded: number;
  attending: number;
  notAttending: number;
  pending: number;
  notInvited: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 