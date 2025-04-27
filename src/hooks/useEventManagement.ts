'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, doc, updateDoc, deleteDoc, addDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Event } from '@/src/models/interfaces';
import { useOccasion } from '@/src/contexts/OccasionContext';
import { useAuth } from '@/src/contexts/AuthContext';
interface UseEventManagementProps {
  occasionId?: string;
  useContext?: boolean;
}

export function useEventManagement({ occasionId, useContext = true }: UseEventManagementProps = {}) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Try to use the occasion context if available and requested
  let occasionContext = null;
  
  if (useContext) {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      occasionContext = useOccasion();
    } catch {
      // Context not available, continue without it
    }
  }

  const fetchData = async () => {
    try {
      let eventsQuery;

      // Create appropriate query based on whether we're filtering by occasionId
      if (occasionId || occasionContext?.occasion?.id) {
        const seriesId = occasionId || occasionContext?.occasion?.id;
        eventsQuery = query(
          collection(db, 'events'),
          where('occasionId', '==', seriesId),
        );
      } else {
        eventsQuery = query(
          collection(db, 'events'),
        );
      }

      // Use context data if available, otherwise fetch from Firestore
      if (occasionContext && !occasionId) {
        setEvents(occasionContext.events);
        setLoading(occasionContext.loading);
      } else {
        const eventsSnapshot = await getDocs(eventsQuery);

        const eventsList = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        setEvents(eventsList);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const checkDuplicateEventName = (name: string, excludeEventId?: string): void => {
    const existingEvent = events.find(event => 
      (!excludeEventId || event.id !== excludeEventId) && 
      event.name === name
    );

    if (existingEvent) {
      throw new Error(`An event named "${name}" already exists in this occasion`);
    }
  };

  const handleAddEvent = async (eventData: Partial<Event>) => {
    if (!eventData.name || !eventData.startDateTime) return;
    
    try {
      const id = occasionId || occasionContext?.occasion?.id;
      if (!id) {
        throw new Error('No occasion ID provided');
      }
      
      const occasion = occasionContext?.occasion;

      checkDuplicateEventName(eventData.name as string);

      const newEvent = {
        ...eventData,
        occasionId: id,
        createdBy: user?.uid,
        occasionAlias: occasion?.alias ?? '',
        createdAt: new Date(),
        additionalFields: eventData.additionalFields || {}
      };
      
      await addDoc(collection(db, 'events'), newEvent);
      
      // Use context refresh if available, otherwise fetch data
      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const handleUpdateEvent = async (eventData: Partial<Event>) => {
    if (!eventData.id || !eventData.name || !eventData.startDateTime) return;
    
    try {
      checkDuplicateEventName(eventData.name as string, eventData.id);

      await updateDoc(doc(db, 'events', eventData.id), {
        name: eventData.name,
        description: eventData.description || '',
        location: eventData.location || '',
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime || null,
        additionalFields: eventData.additionalFields || {}
      });
      
      // Use context refresh if available, otherwise fetch data
      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteDoc(doc(db, 'events', id));
      
      // Use context refresh if available, otherwise fetch data
      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const formatEventDate = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      return 'Invalid date';
    }
  };
  
  const formatEventTime = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', { 
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch {
      return 'Invalid time';
    }
  };

  // Initialize data
  useEffect(() => {
    fetchData();
  }, [occasionId, occasionContext?.occasion?.id]);

  return {
    events,
    loading,
    editingEvent,
    setEditingEvent,
    fetchData,
    handleAddEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    formatEventDate,
    formatEventTime
  };
} 