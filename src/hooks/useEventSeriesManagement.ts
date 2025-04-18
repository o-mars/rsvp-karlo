'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, where, limit, writeBatch } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { EventSeries } from '@/src/models/interfaces';
import { useEventSeries } from '@/src/contexts/EventSeriesContext';

interface UseEventSeriesManagementProps {
  alias?: string | null;
  useContext?: boolean;
  userId?: string | null;
}

export function useEventSeriesManagement({ alias, useContext = true, userId = null }: UseEventSeriesManagementProps = {}) {
  const [eventSeries, setEventSeries] = useState<EventSeries | null>(null);
  const [eventSeriesList, setEventSeriesList] = useState<EventSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aliasDoc, setAliasDoc] = useState<{id: string, eventSeriesId: string} | null>(null);

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

  const fetchEventSeries = async () => {
    if (!alias) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Find the event series by alias
      const eventSeriesQuery = query(
        collection(db, 'eventSeries'), 
        where('alias', '==', alias),
        limit(1)
      );
      
      const querySnapshot = await getDocs(eventSeriesQuery);
      
      if (querySnapshot.empty) {
        setError('Event series not found');
        setLoading(false);
        return;
      }
      
      // Get the first matching document
      const eventSeriesDoc = querySnapshot.docs[0];
      const seriesData = {
        id: eventSeriesDoc.id,
        ...eventSeriesDoc.data()
      } as EventSeries;
      
      setEventSeries(seriesData);
      
      // Find the alias document
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('alias', '==', alias)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      if (!aliasSnapshot.empty) {
        const aliasDocData = aliasSnapshot.docs[0];
        setAliasDoc({
          id: aliasDocData.id,
          eventSeriesId: aliasDocData.data().eventSeriesId
        });
      }
    } catch (err) {
      console.error('Error fetching event series:', err);
      setError('Error loading event series. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEventSeries = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const eventSeriesQuery = query(
        collection(db, 'eventSeries'), 
        where('createdBy', '==', userId)
      );
      
      const querySnapshot = await getDocs(eventSeriesQuery);
      const seriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventSeries[];
      
      // Sort by createdAt in descending order
      seriesList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt.toDate();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt.toDate();
        return dateB.getTime() - dateA.getTime();
      });
      
      setEventSeriesList(seriesList);
    } catch (err) {
      console.error('Error fetching event series list:', err);
      setError('Error loading event series list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEventSeries = async (updatedEventSeries: Partial<EventSeries>) => {
    if (!eventSeries || !aliasDoc) return;
    
    try {
      // Create a batch to update both documents atomically
      const batch = writeBatch(db);
      
      // Update the event series document
      const eventSeriesRef = doc(db, 'eventSeries', eventSeries.id);
      batch.update(eventSeriesRef, updatedEventSeries);
      
      // If alias has changed, update the alias document and all events
      if (updatedEventSeries.alias && updatedEventSeries.alias !== alias && alias) {
        // Update the alias in the alias document
        const aliasDocRef = doc(db, 'aliases', aliasDoc.id);
        batch.update(aliasDocRef, { alias: updatedEventSeries.alias });
        
        // Update all events that use this alias
        const eventsQuery = query(
          collection(db, 'events'),
          where('eventSeriesAlias', '==', alias)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        
        eventsSnapshot.forEach(eventDoc => {
          batch.update(doc(db, 'events', eventDoc.id), {
            eventSeriesAlias: updatedEventSeries.alias
          });
        });
      }
      
      // Commit the batch
      await batch.commit();
      
      // Use context refresh if available, otherwise update local state
      if (eventSeriesContext && eventSeriesContext.refreshData && !alias) {
        await eventSeriesContext.refreshData();
      } else {
        setEventSeries(prev => prev ? { ...prev, ...updatedEventSeries } : null);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating event series:', error);
      throw error;
    }
  };

  const handleDeleteEventSeries = async () => {
    if (!eventSeries || !aliasDoc) return;
    
    try {
      // Create a batch to delete all related documents atomically
      const batch = writeBatch(db);
      
      // Delete the event series document
      const eventSeriesRef = doc(db, 'eventSeries', eventSeries.id);
      batch.delete(eventSeriesRef);
      
      // Delete the alias document
      const aliasDocRef = doc(db, 'aliases', aliasDoc.id);
      batch.delete(aliasDocRef);
      
      // Delete all events in this series
      const eventsQuery = query(
        collection(db, 'events'),
        where('eventSeriesId', '==', eventSeries.id)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      eventsSnapshot.forEach(eventDoc => {
        batch.delete(doc(db, 'events', eventDoc.id));
      });
      
      // Delete all guests in this series
      const guestsQuery = query(
        collection(db, 'guests'),
        where('eventSeriesId', '==', eventSeries.id)
      );
      const guestsSnapshot = await getDocs(guestsQuery);
      
      guestsSnapshot.forEach(guestDoc => {
        batch.delete(doc(db, 'guests', guestDoc.id));
      });
      
      // Commit the batch
      await batch.commit();
      
      // Use context refresh if available, otherwise update local state
      if (eventSeriesContext && eventSeriesContext.refreshData && !alias) {
        await eventSeriesContext.refreshData();
      } else {
        setEventSeries(null);
        setAliasDoc(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting event series:', error);
      throw error;
    }
  };

  const handleAddEventSeries = async (newEventSeries: Partial<EventSeries>) => {
    if (!userId) return;
    
    try {
      if (!newEventSeries.alias) {
        throw new Error('Alias is required');
      }

      // Perform final alias uniqueness check
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('alias', '==', newEventSeries.alias)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      if (!aliasSnapshot.empty) {
        throw new Error('This alias is already taken. Please choose another.');
      }
      
      // Create a new event series document reference with auto-generated ID
      const newEventSeriesRef = doc(collection(db, 'eventSeries'));
      const eventSeriesId = newEventSeriesRef.id;
      
      // Create a batch to perform both operations atomically
      const batch = writeBatch(db);
      
      // Add the event series document
      batch.set(newEventSeriesRef, {
        ...newEventSeries,
        createdBy: userId,
        createdAt: new Date()
      });
      
      // Add the alias document with an auto-generated ID
      const aliasDocRef = doc(collection(db, 'aliases'));
      batch.set(aliasDocRef, {
        alias: newEventSeries.alias,
        eventSeriesId,
        createdBy: userId,
        createdAt: new Date()
      });
      
      // Commit the batch
      await batch.commit();
      
      // Refresh the list if we're in list mode
      if (!alias) {
        await fetchAllEventSeries();
      }
      
      return eventSeriesId;
    } catch (error) {
      console.error('Error creating event series:', error);
      throw error;
    }
  };

  // Initialize data
  useEffect(() => {
    if (alias) {
      fetchEventSeries();
    } else if (userId) {
      fetchAllEventSeries();
    }
  }, [alias, userId]);

  return {
    eventSeries,
    eventSeriesList,
    loading,
    error,
    aliasDoc,
    fetchEventSeries,
    fetchAllEventSeries,
    handleUpdateEventSeries,
    handleDeleteEventSeries,
    handleAddEventSeries
  };
} 