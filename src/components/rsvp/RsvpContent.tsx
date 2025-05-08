import { useState, useEffect, useCallback } from 'react';
import { db } from '@/utils/firebase';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { Guest, Event, RsvpStatus } from '@/src/models/interfaces';
import { RsvpEventCard } from './RsvpEventCard';

interface RsvpContentProps {
  guestId: string;
}

export function RsvpContent({ guestId }: RsvpContentProps) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [additionalGuestsCount, setAdditionalGuestsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchGuestAndEvents = async () => {
      setLoading(true);
      try {
        // Get guest data
        const guestRef = doc(db, 'guests', guestId);
        const guestSnap = await getDoc(guestRef);
        
        if (!guestSnap.exists()) {
          setError('Invalid RSVP code. Please check your invitation and try again.');
          return;
        }

        const guestData = { id: guestSnap.id, ...guestSnap.data() } as Guest;
        setGuest(guestData);

        // Get all events
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const eventsList = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        setEvents(eventsList);

      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestAndEvents();
  }, [guestId]);

  const handleRSVP = async (guestId: string, eventId: string, response: string, isSubGuest: boolean = false) => {
    if (!guest) return;

    try {
      setSaving(true);
      if (isSubGuest) {
        const updatedSubGuests = guest.subGuests.map(subGuest => {
          if (subGuest.id === guestId) {
            return {
              ...subGuest,
              rsvps: { ...subGuest.rsvps, [eventId]: response }
            };
          }
          return subGuest;
        });
        await updateDoc(doc(db, 'guests', guest.id), { subGuests: updatedSubGuests });
        setGuest({ ...guest, subGuests: updatedSubGuests });
      } else {
        const updatedRsvps = { ...guest.rsvps, [eventId]: response };
        const updatedAdditionalRsvps = { ...guest.additionalRsvps };
        
        if (response === RsvpStatus.ATTENDING) {
          updatedAdditionalRsvps[eventId] = updatedAdditionalRsvps[eventId] ?? 0;
        } else {
          delete updatedAdditionalRsvps[eventId];
        }
        
        await updateDoc(doc(db, 'guests', guest.id), { 
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps
        });
        setGuest({ 
          ...guest, 
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps
        });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      setError('Failed to update RSVP. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdditionalGuestsChange = (eventId: string, count: number) => {
    if (!guest) return;
    
    const maxAdditionalGuests = guest.additionalGuests?.[eventId] ?? 0;
    const validatedCount = Math.min(count, maxAdditionalGuests);
    
    setAdditionalGuestsCount(prev => ({
      ...prev,
      [eventId]: validatedCount
    }));
    
    const updatedAdditionalRsvps = { ...guest.additionalRsvps, [eventId]: validatedCount };
    updateDoc(doc(db, 'guests', guest.id), { additionalRsvps: updatedAdditionalRsvps })
      .then(() => {
        setGuest({ ...guest, additionalRsvps: updatedAdditionalRsvps });
      })
      .catch(error => {
        console.error('Error updating additional guests:', error);
        setError('Failed to update additional guests. Please try again.');
      });
  };

  const hasSubGuests = guest?.subGuests && guest.subGuests.length > 0;
  const welcomeMessage = useCallback(() => {
    const prefix = "Dear";
    if (!guest) return '';
    if (!hasSubGuests) {
      return `${prefix} ${guest.firstName} ${guest.lastName},`;
    }

    const hasOneSubGuest = guest.subGuests.length === 1;
    const doesSubGuestShareLastName = guest.subGuests.some(subGuest => subGuest.lastName === guest.lastName);
    
    if (hasOneSubGuest) {
      if (doesSubGuestShareLastName) {
        return `${prefix} ${guest.firstName} & ${guest.subGuests[0].firstName} ${guest.lastName},`;
      } else {
        return `${prefix} ${guest.firstName} ${guest.lastName} & ${guest.subGuests[0].firstName} ${guest.subGuests[0].lastName},`;
      }
    }

    if (doesSubGuestShareLastName) {
      return `${prefix} ${guest.firstName} ${guest.lastName} & Family,`;
    } else {
      return `${prefix} ${guest.firstName} ${guest.lastName} & Friends,`;
    }
  }, [guest, hasSubGuests]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-800 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-lg p-5 mb-8 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-[var(--blossom-text-dark)]">
          {welcomeMessage()}
        </h2>
        <p className="text-[var(--blossom-text-light)] mb-6">
          Please let us know if you&apos;ll be joining us for the following events.
        </p>

        <div className="space-y-6">
          {[...events].sort((a, b) => {
            const dateA = a.startDateTime?.toDate() || new Date(0);
            const dateB = b.startDateTime?.toDate() || new Date(0);
            return dateA.getTime() - dateB.getTime();
          }).map((event) => {
            if (!guest.rsvps[event.id]) return null;
            
            return (
              <RsvpEventCard
                key={event.id}
                event={event}
                guest={guest}
                onRSVP={handleRSVP}
                onAdditionalGuestsChange={handleAdditionalGuestsChange}
                saving={saving}
                additionalGuestsCount={additionalGuestsCount}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
} 