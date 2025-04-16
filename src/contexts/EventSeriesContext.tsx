'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EventSeries, Event, Guest } from '../models/interfaces';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../utils/firebase';

interface EventSeriesContextType {
  eventSeries: EventSeries | null;
  events: Event[];
  guests: Guest[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  alias: string | null;
}

const EventSeriesContext = createContext<EventSeriesContextType | undefined>(undefined);

export function EventSeriesProvider({ children, initialAlias }: { children: ReactNode, initialAlias: string | null }) {
  const [eventSeries, setEventSeries] = useState<EventSeries | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alias] = useState<string | null>(initialAlias);

  const fetchEventSeriesData = async () => {
    if (!alias) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get the event series ID from the aliases collection
      const aliasDocRef = doc(db, 'aliases', alias);
      const aliasDoc = await getDoc(aliasDocRef);
      
      if (!aliasDoc.exists()) {
        setError('Event series not found');
        setLoading(false);
        return;
      }
      
      const { eventSeriesId } = aliasDoc.data();
      
      // Then, get the event series details
      const eventSeriesRef = doc(db, 'eventSeries', eventSeriesId);
      const eventSeriesDoc = await getDoc(eventSeriesRef);
      
      if (eventSeriesDoc.exists()) {
        setEventSeries({
          id: eventSeriesDoc.id,
          ...eventSeriesDoc.data()
        } as EventSeries);
        
        // Fetch the events for this series
        const eventsQuery = query(
          collection(db, 'events'), 
          where('eventSeriesId', '==', eventSeriesId)
        );
        
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        
        // Sort by date
        eventsList.sort((a, b) => 
          new Date(a.startDateTime.toDate()).getTime() - new Date(b.startDateTime.toDate()).getTime()
        );
        
        setEvents(eventsList);
        
        // Fetch guests for this series
        const guestsQuery = query(
          collection(db, 'guests'),
          where('eventSeriesId', '==', eventSeriesId)
        );
        
        const guestsSnapshot = await getDocs(guestsQuery);
        const guestsList = guestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Guest[];
        
        setGuests(guestsList);
      } else {
        setError('Event series not found');
      }
    } catch (err) {
      console.error('Error fetching event series data:', err);
      setError('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alias) {
      fetchEventSeriesData();
    }
  }, [alias]);

  const refreshData = async () => {
    await fetchEventSeriesData();
  };

  return (
    <EventSeriesContext.Provider 
      value={{ 
        eventSeries, 
        events, 
        guests, 
        loading, 
        error, 
        refreshData,
        alias
      }}
    >
      {children}
    </EventSeriesContext.Provider>
  );
}

export function useEventSeries() {
  const context = useContext(EventSeriesContext);
  if (context === undefined) {
    throw new Error('useEventSeries must be used within an EventSeriesProvider');
  }
  return context;
} 