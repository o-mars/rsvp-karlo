import { Timestamp } from "firebase/firestore";

export enum RsvpStatus {
  ATTENDING = "Attending",
  NOT_ATTENDING = "Not Attending",
  AWAITING_RESPONSE = "Awaiting Response",
  NOT_INVITED = "Not Invited",
}

export type RSVPStatus =
  | RsvpStatus.ATTENDING
  | RsvpStatus.NOT_ATTENDING
  | RsvpStatus.AWAITING_RESPONSE
  | RsvpStatus.NOT_INVITED;
export type EventId = string;
export type OccasionId = string;
export type GuestId = string;
export type SubGuestId = string;
export type UserId = string;
export type TagId = string;

export interface Event {
  id: EventId;
  occasionId: OccasionId;
  createdBy: UserId;
  occasionAlias: string;
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // 24-hour time string (HH:mm)
  location: string;
  description?: string;
  createdAt: Timestamp;
  additionalFields?: Record<string, string>;
  inviteImageUrl?: string;
}

export interface Occasion {
  id: OccasionId;
  name: string;
  alias: string;
  createdBy: UserId;
  createdAt: Timestamp;
  description?: string;
  hosts: UserId[];
  inviteImageUrl?: string;
}

export interface SubGuest {
  id: SubGuestId;
  firstName: string;
  lastName: string;
  rsvps: Record<EventId, RsvpStatus>;
  assignedByGuest?: boolean; // Indicates whether the sub-guest was added by the guest (vs host)
}

export interface Guest {
  id: GuestId;
  occasionId: OccasionId;
  occasionAlias: string;
  createdBy: UserId;
  firstName: string;
  lastName: string;
  email: string[];
  emailSent: boolean;
  token: string;
  rsvps: Record<EventId, RsvpStatus>;
  subGuests: SubGuest[];
  additionalGuests?: Record<EventId, number>;
  additionalRsvps?: Record<EventId, number>;
  tags?: TagId[];
}

export interface EventStats {
  totalGuests: number; // This seems unnecessary - invited is the true totalGuests for a given event, you may want this figure for other reasons...
  invited: number; // This is the true totalGuests for a given event
  responded: number;
  attending: number;
  notAttending: number;
  pending: number;
  notInvited: number;
}

export interface Tag {
  id: TagId;
  name: string;
  color: string;
  occasionId: OccasionId;
  createdBy: UserId;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
