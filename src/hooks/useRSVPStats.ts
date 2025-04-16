'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Guest, Event, EventStats } from '@/src/models/interfaces';

interface UseRSVPStatsProps {
  eventSeriesId?: string;
}

// Define a more specific interface for Firestore Timestamp
interface TimestampWithToDate {
  toDate: () => Date;
}

// Typescript type that covers possible timestamp formats
type TimestampLike = Date | TimestampWithToDate | number | string | null | undefined;

// Helper function to safely convert Firestore Timestamp to Date
export const timestampToDate = (timestamp: TimestampLike): Date | null => {
  if (!timestamp) return null;
  
  try {
    // If it's already a Date object, return it
    if (timestamp instanceof Date) return timestamp;
    
    // If it's a Firestore Timestamp with toDate method
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // If it's a number (seconds), convert to Date
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000);
    }
    
    // If it's a string, try to parse it
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    
    return null;
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return null;
  }
};

// Helper function to format a date as a string
export const formatDate = (date: Date | null, format: string = 'short'): string => {
  if (!date) return 'No date';
  
  try {
    if (format === 'short') {
      return date.toLocaleDateString();
    } else if (format === 'long') {
      return date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else if (format === 'time') {
      return date.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } else if (format === 'datetime') {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`;
    }
    return date.toString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Client-side sorting helpers
const sortByStartDateTime = (events: Event[]): Event[] => {
  return [...events].sort((a, b) => {
    const dateA = timestampToDate(a.startDateTime);
    const dateB = timestampToDate(b.startDateTime);
    
    if (!dateA) return 1; // null dates go last
    if (!dateB) return -1;
    
    return dateA.getTime() - dateB.getTime();
  });
};

const sortByLastName = (guests: Guest[]): Guest[] => {
  return [...guests].sort((a, b) => {
    const lastNameA = a.lastName?.toLowerCase() || '';
    const lastNameB = b.lastName?.toLowerCase() || '';
    return lastNameA.localeCompare(lastNameB);
  });
};

export function useRSVPStats({ eventSeriesId }: UseRSVPStatsProps = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let eventsQuery;
      let guestsQuery;

      // Create queries based on whether we're filtering by eventSeriesId, but without orderBy
      if (eventSeriesId) {
        eventsQuery = query(
          collection(db, 'events'),
          where('eventSeriesId', '==', eventSeriesId)
        );
        
        guestsQuery = query(
          collection(db, 'guests'),
          where('eventSeriesId', '==', eventSeriesId)
        );
      } else {
        eventsQuery = query(
          collection(db, 'events')
        );
        
        guestsQuery = query(
          collection(db, 'guests')
        );
      }

      const [eventsSnapshot, guestsSnapshot] = await Promise.all([
        getDocs(eventsQuery),
        getDocs(guestsQuery),
      ]);

      let eventsList = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      let guestsList = guestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Guest[];

      // Apply client-side sorting
      eventsList = sortByStartDateTime(eventsList);
      guestsList = sortByLastName(guestsList);

      setEvents(eventsList);
      setGuests(guestsList);
    } catch (error) {
      console.error('Error fetching RSVP data:', error);
      setError('Failed to load RSVP data');
    } finally {
      setLoading(false);
    }
  };

  const getEventStats = (eventId: string): EventStats => {
    const eventGuests = guests.filter(g => g.rsvps && g.rsvps[eventId] !== undefined);
    const totalGuests = guests.length;
    const invited = eventGuests.length;
    const responded = eventGuests.filter(g => g.rsvps[eventId] === 'yes' || g.rsvps[eventId] === 'no').length;
    const attending = eventGuests.filter(g => g.rsvps[eventId] === 'yes').length;
    const notAttending = eventGuests.filter(g => g.rsvps[eventId] === 'no').length;
    const pending = eventGuests.filter(g => g.rsvps[eventId] === 'pending').length;
    const notInvited = totalGuests - invited;

    return {
      totalGuests,
      invited,
      responded,
      attending,
      notAttending,
      pending,
      notInvited
    };
  };

  // Get stats for all events
  const getAllEventStats = () => {
    return events.reduce((acc, event) => {
      acc[event.id] = getEventStats(event.id);
      return acc;
    }, {} as Record<string, EventStats>);
  };

  // Format an event date safely
  const getEventDate = (event: Event, format: string = 'long'): string => {
    if (!event || !event.startDateTime) return 'No date';
    const date = timestampToDate(event.startDateTime);
    return formatDate(date, format);
  };

  // Format an event time safely
  const getEventTime = (event: Event): string => {
    if (!event || !event.startDateTime) return 'No time';
    const date = timestampToDate(event.startDateTime);
    return formatDate(date, 'time');
  };

  // Get formatted date range for an event
  const getEventDateTimeDisplay = (event: Event): string => {
    if (!event || !event.startDateTime) return 'No date/time';
    
    const startDate = timestampToDate(event.startDateTime);
    if (!startDate) return 'Invalid date';
    
    const startStr = formatDate(startDate, 'datetime');
    
    if (!event.endDateTime) return startStr;
    
    const endDate = timestampToDate(event.endDateTime);
    if (!endDate) return startStr;
    
    // If same day, just show different times
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${formatDate(startDate, 'long')} ${formatDate(startDate, 'time')} - ${formatDate(endDate, 'time')}`;
    }
    
    // Different days
    return `${formatDate(startDate, 'datetime')} - ${formatDate(endDate, 'datetime')}`;
  };

  // Initialize data
  useEffect(() => {
    fetchData();
  }, [eventSeriesId]);

  return {
    events,
    guests,
    loading,
    error,
    getEventStats,
    getAllEventStats,
    getEventDate,
    getEventTime,
    getEventDateTimeDisplay,
    refreshData: fetchData
  };
} 