'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, doc, updateDoc, deleteDoc, addDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Event } from '@/src/models/interfaces';
import { useEventSeries } from '@/src/contexts/EventSeriesContext';

interface UseEventManagementProps {
  eventSeriesId?: string;
  useContext?: boolean;
}

export function useEventManagement({ eventSeriesId, useContext = true }: UseEventManagementProps = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Try to use the event series context if available and requested
  let eventSeriesContext = null;
  
  if (useContext) {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      eventSeriesContext = useEventSeries();
    } catch {
      // Context not available, continue without it
    }
  }

  const fetchData = async () => {
    try {
      let eventsQuery;

      // Create appropriate query based on whether we're filtering by eventSeriesId
      if (eventSeriesId || eventSeriesContext?.eventSeries?.id) {
        const seriesId = eventSeriesId || eventSeriesContext?.eventSeries?.id;
        eventsQuery = query(
          collection(db, 'events'),
          where('eventSeriesId', '==', seriesId),
        );
      } else {
        eventsQuery = query(
          collection(db, 'events'),
        );
      }

      // Use context data if available, otherwise fetch from Firestore
      if (eventSeriesContext && !eventSeriesId) {
        setEvents(eventSeriesContext.events);
        setLoading(eventSeriesContext.loading);
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

  const handleAddEvent = async (eventData: Partial<Event>) => {
    if (!eventData.name || !eventData.startDateTime) return;
    
    try {
      const seriesId = eventSeriesId || eventSeriesContext?.eventSeries?.id;
      if (!seriesId) {
        throw new Error('No event series ID provided');
      }
      
      const series = eventSeriesContext?.eventSeries;
      if (!series) {
        throw new Error('No event series context available');
      }

      const newEvent = {
        ...eventData,
        eventSeriesId: seriesId,
        createdBy: series.createdBy,
        eventSeriesAlias: series.alias,
        createdAt: new Date(),
        additionalFields: eventData.additionalFields || {}
      };
      
      await addDoc(collection(db, 'events'), newEvent);
      
      // Use context refresh if available, otherwise fetch data
      if (eventSeriesContext && eventSeriesContext.refreshData && !eventSeriesId) {
        await eventSeriesContext.refreshData();
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
      await updateDoc(doc(db, 'events', eventData.id), {
        name: eventData.name,
        description: eventData.description || '',
        location: eventData.location || '',
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime || null,
        additionalFields: eventData.additionalFields || {}
      });
      
      // Use context refresh if available, otherwise fetch data
      if (eventSeriesContext && eventSeriesContext.refreshData && !eventSeriesId) {
        await eventSeriesContext.refreshData();
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
      if (eventSeriesContext && eventSeriesContext.refreshData && !eventSeriesId) {
        await eventSeriesContext.refreshData();
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
  }, [eventSeriesId, eventSeriesContext?.eventSeries?.id]);

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