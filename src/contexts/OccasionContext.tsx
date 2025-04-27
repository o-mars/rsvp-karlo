'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Occasion, Event, Guest } from '../models/interfaces';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../utils/firebase';

interface OccasionContextType {
  occasion: Occasion | null;
  events: Event[];
  guests: Guest[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  alias: string | null;
}

const OccasionContext = createContext<OccasionContextType | undefined>(undefined);

export function OccasionProvider({ children, initialAlias }: { children: ReactNode, initialAlias: string | null }) {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alias] = useState<string | null>(initialAlias);

  const fetchOccasionData = async () => {
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
      
      const { occasionId } = aliasDoc.data();
      
      // Then, get the occasion details
      const occasionRef = doc(db, 'occasions', occasionId);
      const occasionDoc = await getDoc(occasionRef);
      
      if (occasionDoc.exists()) {
        setOccasion({
          id: occasionDoc.id,
          ...occasionDoc.data()
        } as Occasion);
        
        // Fetch the events for this series
        const eventsQuery = query(
          collection(db, 'events'), 
          where('occasionId', '==', occasionId)
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
          where('occasionId', '==', occasionId)
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
      console.error('Error fetching occasion data:', err);
      setError('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alias) {
      fetchOccasionData();
    }
  }, [alias]);

  const refreshData = async () => {
    await fetchOccasionData();
  };

  return (
    <OccasionContext.Provider 
      value={{ 
        occasion, 
        events, 
        guests, 
        loading, 
        error, 
        refreshData,
        alias
      }}
    >
      {children}
    </OccasionContext.Provider>
  );
}

export function useOccasion() {
  const context = useContext(OccasionContext);
  if (context === undefined) {
    throw new Error('useOccasion must be used within an OccasionProvider');
  }
  return context;
} 