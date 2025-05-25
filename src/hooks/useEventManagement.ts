'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, doc, updateDoc, addDoc, Timestamp, where, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { db, storage } from '@/utils/firebase';
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
    if (!user?.uid) return;

    try {
      let eventsQuery;

      if (occasionId || occasionContext?.occasion?.id) {
        const seriesId = occasionId || occasionContext?.occasion?.id;
        eventsQuery = query(
          collection(db, 'events'),
          where('createdBy', '==', user.uid),
          where('occasionId', '==', seriesId),
        );
      } else {
        eventsQuery = query(
          collection(db, 'events'),
          where('createdBy', '==', user.uid),
        );
      }

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

  const uploadEventInvite = async (file: File, eventId: string, occasionAlias: string): Promise<string> => {
    try {
      if (!occasionAlias) {
        throw new Error('No occasion alias provided');
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      // Use eventId in path for security, but keep occasionAlias for organization
      const storageRef = ref(storage, `${occasionAlias}/events/${eventId}/event-invite.${fileExtension}`);
      
      const metadata = {
        customMetadata: {
          createdBy: user?.uid || '',
          eventId: eventId,
          createdAt: new Date().toISOString()
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading event invite:', error);
      throw error;
    }
  };

  const handleAddEvent = async (eventData: Partial<Event>, imageFile: File | null) => {
    if (!eventData.name || !eventData.date || !eventData.time) return;
    
    try {
      const id = occasionId || occasionContext?.occasion?.id;
      if (!id) {
        throw new Error('No occasion ID provided');
      }
      
      if (!eventData.occasionAlias) {
        throw new Error('No occasion alias provided');
      }

      checkDuplicateEventName(eventData.name as string);

      const newEvent = {
        ...eventData,
        occasionId: id,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
        additionalFields: eventData.additionalFields || {},
      };
      
      const docRef = await addDoc(collection(db, 'events'), newEvent);

      if (imageFile) {
        const downloadUrl = await uploadEventInvite(imageFile, docRef.id, eventData.occasionAlias);
        await updateDoc(docRef, { inviteImageUrl: downloadUrl });
      }
      
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

  const handleUpdateEvent = async (eventData: Partial<Event>, imageFile: File | null) => {
    if (!eventData.id || !eventData.name || !eventData.date || !eventData.time) return;
    
    try {
      checkDuplicateEventName(eventData.name as string, eventData.id);

      let finalImageUrl = eventData.inviteImageUrl;
      if (imageFile) {
        if (!eventData.occasionAlias) {
          throw new Error('No occasion alias provided');
        }
        finalImageUrl = await uploadEventInvite(imageFile, eventData.id, eventData.occasionAlias);
      }

      await updateDoc(doc(db, 'events', eventData.id), {
        name: eventData.name,
        description: eventData.description || '',
        location: eventData.location || '',
        additionalFields: eventData.additionalFields || {},
        date: eventData.date,
        time: eventData.time,
        ...(finalImageUrl ? { inviteImageUrl: finalImageUrl } : {}),
      });
      
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

  const handleDeleteEvent = async (eventToDelete: Event) => {
    try {
      await deleteDoc(doc(db, 'events', eventToDelete.id));

      try {
        if (eventToDelete.occasionAlias) {
          const eventStorageRef = ref(storage, `${eventToDelete.occasionAlias}/events/${eventToDelete.id}`);
          const storageList = await listAll(eventStorageRef);
          
          const deletePromises = storageList.items.map(item => deleteObject(item));
          await Promise.all(deletePromises);
        }
      } catch (error) {
        console.error('Error deleting storage files:', error);
      }

      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
      } else {
        await fetchData();
      }
      
      return true;
    } catch (error) {
      console.error('Error in deletion process:', error);
      throw error;
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
    uploadEventInvite
  };
} 