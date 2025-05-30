import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Guest, Event, RsvpStatus, GuestId, EventId, RSVPStatus } from '@/src/models/interfaces';
import { RsvpEventCard } from './RsvpEventCard';
import { useToast } from '@/src/hooks/useToast';
import { useAuth } from '@/src/contexts/AuthContext';
import { Toaster } from '@/src/components/ui/toaster';

interface RsvpContentProps {
  guestId: string;
  onError: (error: string) => void;
}

export function RsvpContent({ guestId, onError }: RsvpContentProps) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalGuestsCount, setAdditionalGuestsCount] = useState<Record<EventId, number>>({});
  /* Commented out guest name handling
  const [additionalGuestNames, setAdditionalGuestNames] = useState<Record<EventId, Array<{ firstName: string; lastName: string }>>>({});
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});
  */
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchGuestAndEvents = async () => {
      setLoading(true);
      try {
        const guestRef = doc(db, 'guests', guestId);
        const guestSnap = await getDoc(guestRef);
        if (!guestSnap.exists()) {
          const errorMessage = 'Invalid RSVP code. Please check your invitation and try again.';
          setError(errorMessage);
          onError(errorMessage);
          return;
        }

        const guestData = { id: guestSnap.id, ...guestSnap.data() } as Guest;
        setGuest(guestData);

        // Initialize additional guests state from guest data
        const initialAdditionalGuestsCount: Record<EventId, number> = {};
        /* Commented out guest name handling
        const initialAdditionalGuestNames: Record<EventId, Array<{ firstName: string; lastName: string }>> = {};

        // Get additional guest names from subGuests
        if (guestData.subGuests) {
          // Group sub-guests by event
          const subGuestsByEvent = guestData.subGuests.reduce((acc, subGuest) => {
            if (subGuest.assignedByGuest) {
              Object.entries(subGuest.rsvps).forEach(([eventId, status]) => {
                if (status === RsvpStatus.ATTENDING) {
                  if (!acc[eventId]) {
                    acc[eventId] = [];
                  }
                  // Only add if not already present (avoid duplicates)
                  const exists = acc[eventId].some(name => 
                    name.firstName === subGuest.firstName && 
                    name.lastName === subGuest.lastName
                  );
                  if (!exists) {
                    acc[eventId].push({
                      firstName: subGuest.firstName,
                      lastName: subGuest.lastName
                    });
                  }
                }
              });
            }
            return acc;
          }, {} as Record<EventId, Array<{ firstName: string; lastName: string }>>);

          // Merge with initialAdditionalGuestNames
          Object.entries(subGuestsByEvent).forEach(([eventId, names]) => {
            initialAdditionalGuestNames[eventId] = names;
          });
        }
        */

        // Get additional guest counts from additionalRsvps
        if (guestData.additionalRsvps) {
          Object.entries(guestData.additionalRsvps).forEach(([eventId, count]) => {
            initialAdditionalGuestsCount[eventId] = count;
          });
        }

        setAdditionalGuestsCount(initialAdditionalGuestsCount);
        /* Commented out guest name handling
        setAdditionalGuestNames(initialAdditionalGuestNames);
        */

        const eventIds = Object.keys(guestData.rsvps || {});
        const eventsList: Event[] = [];
        
        for (const eventId of eventIds) {
          const eventRef = doc(db, 'events', eventId);
          const eventSnap = await getDoc(eventRef);
          if (eventSnap.exists()) {
            eventsList.push({ id: eventSnap.id, ...eventSnap.data() } as Event);
          }
        }
        
        setEvents(eventsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

      } catch (err) {
        const errorMessage = 'An error occurred. Please try again.';
        setError(errorMessage);
        onError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestAndEvents();
  }, [guestId, onError]);

  const handleRSVP = async (guestId: GuestId, eventId: EventId, response: RSVPStatus, isSubGuest: boolean = false) => {
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
        toast({
          title: "RSVP saved successfully",
          variant: "success",
        });
      } else {
        const updatedRsvps = { ...guest.rsvps, [eventId]: response };
        const updatedAdditionalRsvps = { ...guest.additionalRsvps };
        const updatedSubGuests = [...guest.subGuests];
        
        if (response === RsvpStatus.ATTENDING) {
          /* Commented out guest name handling
          // Get the current additional guest names for this event
          const additionalNames = additionalGuestNames[eventId] || [];
          const additionalCount = additionalGuestsCount[eventId] || 0;
          
          // First, remove any guest-assigned sub-guests that are no longer in any additional guests list
          const allAdditionalNames = Object.values(additionalGuestNames).flat();
          updatedSubGuests = updatedSubGuests.filter(sg => {
            // Keep non-guest-assigned sub-guests
            if (!sg.assignedByGuest) return true;
            
            // Check if this sub-guest's name exists in any additional guests list
            return allAdditionalNames.some(name => 
              name.firstName.toLowerCase() === sg.firstName.toLowerCase() && 
              name.lastName.toLowerCase() === sg.lastName.toLowerCase()
            );
          });
          
          // Now handle the current event's additional guests
          additionalNames.forEach((name, index) => {
            if (index < additionalCount && name.firstName.trim() && name.lastName.trim()) {
              // Check if there's an existing guest-assigned sub-guest with the same name
              const existingSubGuest = updatedSubGuests.find(sg => 
                sg.assignedByGuest && 
                sg.firstName.toLowerCase() === name.firstName.trim().toLowerCase() && 
                sg.lastName.toLowerCase() === name.lastName.trim().toLowerCase()
              );

              if (existingSubGuest) {
                // If found, just add this event to their RSVPs
                existingSubGuest.rsvps[eventId] = RsvpStatus.ATTENDING;
              } else {
                // If not found, create a new sub-guest
                const newSubGuest: SubGuest = {
                  id: `${guest.id}-${eventId}-${index}-${Date.now()}`,
                  firstName: name.firstName.trim(),
                  lastName: name.lastName.trim(),
                  rsvps: { [eventId]: RsvpStatus.ATTENDING },
                  assignedByGuest: true
                };
                updatedSubGuests.push(newSubGuest);
              }
            }
          });
          */
          const additionalCount = additionalGuestsCount[eventId] || 0;
          updatedAdditionalRsvps[eventId] = additionalCount;
        } else {
          /* Commented out guest name handling
          // If not attending, remove any guest-assigned sub-guests for this event
          updatedSubGuests = updatedSubGuests.filter(sg => 
            !(sg.assignedByGuest && sg.rsvps[eventId] === RsvpStatus.ATTENDING)
          );
          */
          delete updatedAdditionalRsvps[eventId];
        }
        
        await updateDoc(doc(db, 'guests', guest.id), {
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps,
          subGuests: updatedSubGuests
        });
        
        setGuest({
          ...guest,
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps,
          subGuests: updatedSubGuests
        });
        toast({
          title: "RSVP saved successfully",
          variant: "success",
        });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      setError('Failed to update RSVP. Please try again.');
      toast({
        title: "Failed to save RSVP",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAdditionalGuestsChange = (eventId: EventId, count: number) => {
    if (!guest) return;
    
    const maxAdditionalGuests = guest.additionalGuests?.[eventId] ?? 0;
    const validatedCount = Math.min(count, maxAdditionalGuests);
    
    setAdditionalGuestsCount(prev => ({
      ...prev,
      [eventId]: validatedCount
    }));
    
    /* Commented out guest name handling
    // Initialize or update additional guest names array
    setAdditionalGuestNames(prev => {
      const currentNames = prev[eventId] || [];
      const newNames = [...currentNames];
      
      // Add empty names for new slots
      while (newNames.length < validatedCount) {
        newNames.push({ firstName: '', lastName: '' });
      }
      
      // Remove extra names if count decreased
      while (newNames.length > validatedCount) {
        newNames.pop();
      }
      
      return {
        ...prev,
        [eventId]: newNames
      };
    });
    */
    
    const updatedAdditionalRsvps = { ...guest.additionalRsvps, [eventId]: validatedCount };
    updateDoc(doc(db, 'guests', guest.id), { additionalRsvps: updatedAdditionalRsvps })
      .then(() => {
        setGuest({ ...guest, additionalRsvps: updatedAdditionalRsvps });
        toast({
          title: "RSVP saved successfully",
          variant: "success",
        });
      })
      .catch(error => {
        console.error('Error updating additional guests:', error);
        setError('Failed to update additional guests. Please try again.');
        toast({
          title: "Failed to update additional guests",
          variant: "destructive",
        });
      });
  };

  /* Commented out guest name handling
  const handleAdditionalGuestNameChange = (eventId: EventId, index: number, firstName: string, lastName: string) => {
    // Log the raw input values immediately
    console.log('Raw input values:', {
      eventId,
      index,
      firstName,
      lastName,
      firstNameLength: firstName.length,
      lastNameLength: lastName.length,
      firstNameChars: Array.from(firstName).map(c => c.charCodeAt(0)),
      lastNameChars: Array.from(lastName).map(c => c.charCodeAt(0))
    });

    // Update local state immediately for responsive UI
    setAdditionalGuestNames(prev => {
      const currentNames = prev[eventId] || [];
      const newNames = [...currentNames];
      newNames[index] = { firstName, lastName };
      return {
        ...prev,
        [eventId]: newNames
      };
    });

    // Clear any existing timer for this event
    if (debounceTimers[eventId]) {
      clearTimeout(debounceTimers[eventId]);
    }

    // Set a new timer to update RSVP after 2 seconds
    const timer = setTimeout(async () => {
      if (guest?.rsvps[eventId] === RsvpStatus.ATTENDING) {
        try {
          // Get the latest state for all names
          const latestNames = additionalGuestNames[eventId] || [];
          const additionalCount = additionalGuestsCount[eventId] || 0;
          
          // Create a new array with the latest input values
          const updatedNames = [...latestNames];
          updatedNames[index] = { firstName, lastName };
          
          // Log current state values
          console.log('Current state values:', {
            eventId,
            additionalCount,
            names: updatedNames,
            inputFields: updatedNames.map((name, idx) => ({
              index: idx,
              firstName: name.firstName,
              lastName: name.lastName,
              firstNameLength: name.firstName.length,
              lastNameLength: name.lastName.length
            }))
          });
          
          // Only proceed if we have the expected number of names
          if (updatedNames.length === additionalCount) {
            // Update the state with the latest values before saving
            setAdditionalGuestNames(prev => ({
              ...prev,
              [eventId]: updatedNames
            }));
            
            await handleRSVP(guest.id, eventId, RsvpStatus.ATTENDING, false);
            toast({
              title: "RSVP saved successfully",
              variant: "success",
            });
          }
        } catch (error) {
          console.error('Error updating guest names:', error);
          toast({
            title: "Failed to save guest information",
            variant: "destructive",
          });
        }
      }
    }, 2000);

    setDebounceTimers(prev => ({
      ...prev,
      [eventId]: timer
    }));
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    };
  }, [debounceTimers]);
  */

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

    // TODO: Is this a good heuristic? Any sub-guest sharing last name with main = Family?
    if (doesSubGuestShareLastName) {
      return `${prefix} ${guest.firstName} ${guest.lastName} & Family,`;
    } else {
      return `${prefix} ${guest.firstName} ${guest.lastName}, ${guest.subGuests[0].firstName} ${guest.subGuests[0].lastName} & Others,`;
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
          {events
            .filter(event => guest?.rsvps[event.id] !== undefined)
            .map(event => (
              <RsvpEventCard
                key={event.id}
                event={event}
                guest={guest!}
                onRSVP={handleRSVP}
                onAdditionalGuestsChange={handleAdditionalGuestsChange}
                // onAdditionalGuestNameChange={handleAdditionalGuestNameChange}
                saving={saving}
                additionalGuestsCount={additionalGuestsCount}
                // additionalGuestNames={additionalGuestNames}
                isAdmin={user?.uid === event.createdBy}
              />
            ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
} 



