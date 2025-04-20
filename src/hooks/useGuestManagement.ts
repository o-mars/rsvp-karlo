'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, doc, updateDoc, deleteDoc, setDoc, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Guest, Event } from '@/src/models/interfaces';
import { useEventSeries } from '@/src/contexts/EventSeriesContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useEmailService } from './useEmailService';

interface UseGuestManagementProps {
  eventSeriesId?: string;
  useContext?: boolean;
}

export function useGuestManagement({ eventSeriesId, useContext = true }: UseGuestManagementProps = {}) {
  const { user } = useAuth();
  const { sendBulkInviteEmails } = useEmailService();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Try to use the event series context if available and requested
  let eventSeriesContext = null;
  
  if (useContext) {
    try {
      // This is safe because we're wrapping the actual call with try/catch
      // eslint-disable-next-line react-hooks/rules-of-hooks
      eventSeriesContext = useEventSeries();
    } catch {
      // Context not available, continue without it
    }
  }

  const fetchData = async () => {
    try {
      let eventsQuery;
      let guestsQuery;

      // Create appropriate queries based on whether we're filtering by eventSeriesId
      if (eventSeriesId || eventSeriesContext?.eventSeries?.id) {
        const seriesId = eventSeriesId || eventSeriesContext?.eventSeries?.id;
        eventsQuery = query(
          collection(db, 'events'),
          where('eventSeriesId', '==', seriesId),
        );
        
        guestsQuery = query(
          collection(db, 'guests'),
          where('eventSeriesId', '==', seriesId),
        );
      } else {
        eventsQuery = query(
          collection(db, 'events'),
        );
        
        guestsQuery = query(
          collection(db, 'guests'),
        );
      }

      // Use context data if available, otherwise fetch from Firestore
      if (eventSeriesContext && !eventSeriesId) {
        setEvents(eventSeriesContext.events);
        setGuests(eventSeriesContext.guests);
        setLoading(eventSeriesContext.loading);
      } else {
        const [eventsSnapshot, guestsSnapshot] = await Promise.all([
          getDocs(eventsQuery),
          getDocs(guestsQuery),
        ]);

        const eventsList = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        const guestsList = guestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Guest[];

        setEvents(eventsList);
        setGuests(guestsList);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAddGuest = async (guestData: Partial<Guest>) => {
    const seriesId = eventSeriesId || eventSeriesContext?.eventSeries?.id;
    if (!user || !seriesId || !guestData.firstName || !guestData.lastName) return;
    
    const id = generateGuestId(guestData.firstName, guestData.lastName);
    
    try {
      // Initialize additionalGuests for each event the guest is invited to
      const additionalGuests: Record<string, number> = {};
      // Initialize additionalRsvps with the same keys as rsvps, defaulting to 0
      const additionalRsvps: Record<string, number> = {};
      
      Object.keys(guestData.rsvps || {}).forEach(eventId => {
        additionalGuests[eventId] = guestData.additionalGuests?.[eventId] ?? 0;
        additionalRsvps[eventId] = 0; // Initialize to 0 for each invited event
      });
      
      await setDoc(doc(db, 'guests', id), {
        id,
        eventSeriesId: seriesId,
        eventSeriesAlias: eventSeriesContext?.eventSeries?.alias || '',
        createdBy: user.uid,
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email || '',
        emailSent: false,
        rsvps: guestData.rsvps || {},
        additionalGuests,
        additionalRsvps,
        subGuests: guestData.subGuests || [],
      });
      
      // Use context refresh if available, otherwise fetch data
      if (eventSeriesContext && eventSeriesContext.refreshData && !eventSeriesId) {
        await eventSeriesContext.refreshData();
      } else {
        await fetchData();
      }
      
      return id;
    } catch (error) {
      console.error('Error adding guest:', error);
      throw error;
    }
  };

  const handleUpdateGuest = async (guestData: Partial<Guest>) => {
    if (!guestData.id || !guestData.firstName || !guestData.lastName) return;
    
    try {
      // Ensure additionalGuests is properly initialized for all events
      const additionalGuests: Record<string, number> = {};
      Object.keys(guestData.rsvps || {}).forEach(eventId => {
        additionalGuests[eventId] = guestData.additionalGuests?.[eventId] ?? 0;
      });
      
      // Preserve existing additionalRsvps if they exist
      const additionalRsvps = guestData.additionalRsvps || {};
      
      await updateDoc(doc(db, 'guests', guestData.id), {
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email || '',
        emailSent: guestData.emailSent || false,
        rsvps: guestData.rsvps || {},
        additionalGuests,
        additionalRsvps,
        subGuests: guestData.subGuests || []
      });
      
      // Use context refresh if available, otherwise fetch data
      if (eventSeriesContext && eventSeriesContext.refreshData && !eventSeriesId) {
        await eventSeriesContext.refreshData();
      } else {
        await fetchData();
      }
      
      return guestData.id;
    } catch (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
  };

  const handleDeleteGuest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'guests', id));
      
      // Use context refresh if available, otherwise fetch data
      if (eventSeriesContext && eventSeriesContext.refreshData && !eventSeriesId) {
        await eventSeriesContext.refreshData();
      } else {
        await fetchData();
      }
      
      // Update selected guests state to remove the deleted guest
      setSelectedGuests(prev => prev.filter(guestId => guestId !== id));
      
      return id;
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
  };

  const handleBulkEmail = async (occasionName: string) => {
    try {
      const selectedGuestsData = guests
        .filter(g => selectedGuests.includes(g.id))
        .filter(g => g.email); // Only include guests with email addresses
      
      if (selectedGuestsData.length === 0) {
        throw new Error('No valid email addresses selected');
      }

      const emailData = selectedGuestsData.map(guest => ({
        guestName: `${guest.firstName} ${guest.lastName}`,
        eventName: occasionName,
        loginCode: guest.id,
        eCardUrl: '/WeddingGenericInvite.jpg',
        buttonStyle: {
          backgroundColor: '#ec4899',
          textColor: '#ffffff',
        },
      }));

      await sendBulkInviteEmails(emailData);

      const updatePromises = selectedGuestsData.map(guest =>
        updateDoc(doc(db, 'guests', guest.id), {
          emailSent: true,
        })
      );

      await Promise.all(updatePromises);

      return selectedGuestsData.length;
    } catch (error) {
      console.error('Error in handleBulkEmail:', error);
      throw error;
    }
  };

  const generateGuestId = (firstName: string, lastName: string) => {
    const cleanFirstName = firstName.trim().replace(/[^A-Za-z0-9]/g, '');
    const cleanLastName = lastName.trim().replace(/[^A-Za-z0-9]/g, '');
    
    const namePrefix = cleanFirstName && cleanLastName 
      ? `${cleanFirstName}-${cleanLastName}-`
      : '';

    const numCharsToGenerate = 8;
    const bytesForBase64Chars = 6;
    const randomBytes = new Uint8Array(bytesForBase64Chars);
    crypto.getRandomValues(randomBytes);
    const randomSuffix = btoa(String.fromCharCode(...randomBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
      .substring(0, numCharsToGenerate);
      
    return namePrefix + randomSuffix;
  }

  useEffect(() => {
    fetchData();
  }, [eventSeriesId, eventSeriesContext?.eventSeries?.id]);

  return {
    guests,
    events,
    loading,
    selectedGuests,
    setSelectedGuests,
    editingGuest,
    setEditingGuest,
    fetchData,
    handleAddGuest,
    handleUpdateGuest,
    handleDeleteGuest,
    handleBulkEmail,
    toggleGuestSelection: (id: string) => {
      setSelectedGuests(prev => 
        prev.includes(id) 
          ? prev.filter(guestId => guestId !== id)
          : [...prev, id]
      );
    },
    toggleAllSelection: (selected: boolean) => {
      if (selected) {
        setSelectedGuests(guests.map(g => g.id));
      } else {
        setSelectedGuests([]);
      }
    },
    isSelected: (id: string) => selectedGuests.includes(id)
  };
} 