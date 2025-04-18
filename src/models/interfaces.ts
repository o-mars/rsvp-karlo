import { Timestamp } from 'firebase/firestore';

export enum RsvpStatus {
  ATTENDING = 'attending',
  NOT_ATTENDING = 'not-attending',
  AWAITING_RESPONSE = 'awaiting-response',
  EMAIL_NOT_SENT = 'email-not-sent',
  NOT_INVITED = 'not-invited'
}

export type RSVPStatus = RsvpStatus.ATTENDING | RsvpStatus.NOT_ATTENDING | RsvpStatus.AWAITING_RESPONSE | RsvpStatus.EMAIL_NOT_SENT | RsvpStatus.NOT_INVITED;

export interface Event {
  id: string;
  eventSeriesId: string;
  createdBy: string;
  eventSeriesAlias: string;
  name: string;
  startDateTime: Timestamp;
  endDateTime?: Timestamp;
  location: string;
  description?: string;
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
  eventSeriesId: string;
  eventSeriesAlias: string;
  createdBy: string;
  firstName: string;
  lastName: string;
  email: string;
  emailSent: boolean;
  token: string;
  rsvps: Record<string, string>;
  subGuests: SubGuest[];
  additionalGuests?: Record<string, number>;
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