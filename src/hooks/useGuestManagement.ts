'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, doc, updateDoc, deleteDoc, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Guest, Event } from '@/src/models/interfaces';
import { useOccasion } from '@/src/contexts/OccasionContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useEmailService } from './useEmailService';

interface UseGuestManagementProps {
  occasionId?: string;
  useContext?: boolean;
}

export function useGuestManagement({ occasionId, useContext = true }: UseGuestManagementProps = {}) {
  const { user } = useAuth();
  const { sendBulkInviteEmails } = useEmailService();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Try to use the occasion context if available and requested
  let occasionContext = null;
  
  if (useContext) {
    try {
      // This is safe because we're wrapping the actual call with try/catch
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
      let guestsQuery;

      // Create appropriate queries based on whether we're filtering by occasionId
      if (occasionId || occasionContext?.occasion?.id) {
        const seriesId = occasionId || occasionContext?.occasion?.id;
        eventsQuery = query(
          collection(db, 'events'),
          where('createdBy', '==', user.uid),
          where('occasionId', '==', seriesId),
        );
        
        guestsQuery = query(
          collection(db, 'guests'),
          where('createdBy', '==', user.uid),
          where('occasionId', '==', seriesId),
        );
      } else {
        eventsQuery = query(
          collection(db, 'events'),
          where('createdBy', '==', user.uid),
        );
        
        guestsQuery = query(
          collection(db, 'guests'),
          where('createdBy', '==', user.uid),
        );
      }

      // Use context data if available, otherwise fetch from Firestore
      if (occasionContext && !occasionId) {
        setEvents(occasionContext.events);
        setGuests(occasionContext.guests);
        setLoading(occasionContext.loading);
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
    const seriesId = occasionId || occasionContext?.occasion?.id;
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
        occasionId: seriesId,
        occasionAlias: occasionContext?.occasion?.alias || '',
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
      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
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
      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
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
      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
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

  const handleBulkEmail = async (occasionName: string, hosts: string[]): Promise<number> => {
    try {
      const selectedGuestsData = guests
        .filter(g => selectedGuests.includes(g.id))
        .filter(g => g.email && g.email.length > 0); // Only include guests with email addresses
      
      if (selectedGuestsData.length === 0) {
        throw new Error('No valid email addresses selected');
      }

      const emailData = {
        occasionName,
        hosts,
        buttonStyle: {
          backgroundColor: '#ec4899',
          textColor: '#ffffff',
        },
        guestIds: selectedGuestsData.map(guest => guest.id)
      };

      // First try to send the emails
      const response = await sendBulkInviteEmails(emailData);
      
      if (!response) {
        throw new Error('No response received from email service');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to send emails');
      }

      // Create a batch write for all updates
      const batch = writeBatch(db);
      
      // Add all updates to the batch
      selectedGuestsData.forEach(guest => {
        const guestRef = doc(db, 'guests', guest.id);
        batch.update(guestRef, { emailSent: true });
      });

      // Commit the batch
      await batch.commit();

      // Update local state to reflect the email sent status
      setGuests(prevGuests => 
        prevGuests.map(guest => 
          selectedGuestsData.some(selectedGuest => selectedGuest.id === guest.id)
            ? { ...guest, emailSent: true }
            : guest
        )
      );

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

    const numCharsToGenerate = 12;
    const bytesForAlphaneumericChars = 9;
    const randomBytes = new Uint8Array(bytesForAlphaneumericChars);
    crypto.getRandomValues(randomBytes);

    const randomSuffix = Array.from(randomBytes)
      .map(byte => (byte % 62))  // Modulo 62 to map to a-zA-Z0-9
      .map(num => 
        num < 10 ? String.fromCharCode(48 + num) :  // 0-9
        num < 36 ? String.fromCharCode(97 + num - 10) :  // a-z
        String.fromCharCode(65 + num - 36)  // A-Z
      ).join('');

    return namePrefix + randomSuffix.substring(0, numCharsToGenerate);
  }

  useEffect(() => {
    fetchData();
  }, [occasionId, occasionContext?.occasion?.id]);

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