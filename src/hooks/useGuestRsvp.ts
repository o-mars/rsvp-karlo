import { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Guest, Event, RsvpStatus, GuestId, EventId, RSVPStatus, SubGuest } from '@/src/models/interfaces';
import { useToast } from '@/src/hooks/useToast';

interface UseGuestRsvpProps {
  guestId: string;
  onError?: (error: string) => void;
}

interface UseGuestRsvpReturn {
  guest: Guest | null;
  events: Event[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  additionalGuestNames: Record<EventId, Array<{ firstName: string; lastName: string }>>;
  isCompleted: boolean;
  handleRSVP: (guestId: GuestId, eventId: EventId, response: RSVPStatus, isSubGuest: boolean) => Promise<void>;
  handleAdditionalGuestCountChange: (eventId: EventId, count: number) => void;
  handleAdditionalGuestNameChange: (eventId: EventId, index: number, firstName: string, lastName: string) => void;
  confirmRSVP: () => Promise<void>;
}

export function useGuestRsvp({ guestId, onError }: UseGuestRsvpProps): UseGuestRsvpReturn {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalGuestNames, setAdditionalGuestNames] = useState<Record<EventId, Array<{ firstName: string; lastName: string }>>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const isCompleted = useMemo(() => {
    if (!guest || !events.length) return false;

    const mainGuestComplete = Object.values(guest.rsvps).every(rsvpStatus => 
      rsvpStatus === RsvpStatus.ATTENDING ||
      rsvpStatus === RsvpStatus.NOT_ATTENDING
    );

    if (!mainGuestComplete) return false;

    const subGuestsComplete = guest.subGuests.every(subGuest =>
      Object.values(subGuest.rsvps).every(rsvpStatus =>
        rsvpStatus === RsvpStatus.ATTENDING ||
        rsvpStatus === RsvpStatus.NOT_ATTENDING
      )
    );

    if (!subGuestsComplete) return false;

    const additionalGuestsComplete = events.every(event => {
      const additionalCount = guest.additionalRsvps?.[event.id] || 0;
      if (additionalCount === 0) return true;
      
      const names = additionalGuestNames[event.id] || [];
      return names.length === additionalCount &&
        names.every(name => name.firstName.trim() && name.lastName.trim());
    });

    return additionalGuestsComplete;
  }, [guest, events, additionalGuestNames]);

  useEffect(() => {
    const fetchGuestAndEvents = async () => {
      setLoading(true);
      try {
        const guestRef = doc(db, 'guests', guestId);
        const guestSnap = await getDoc(guestRef);
        if (!guestSnap.exists()) {
          const errorMessage = 'Invalid RSVP code. Please check your invitation and try again.';
          setError(errorMessage);
          onError?.(errorMessage);
          return;
        }

        const guestData = { id: guestSnap.id, ...guestSnap.data() } as Guest;
        setGuest(guestData);

        const initialAdditionalGuestNames: Record<EventId, Array<{ firstName: string; lastName: string }>> = {};

        if (guestData.subGuests) {
          const subGuestsByEvent = guestData.subGuests.reduce((acc, subGuest) => {
            if (subGuest.assignedByGuest) {
              Object.entries(subGuest.rsvps).forEach(([eventId, status]) => {
                if (status === RsvpStatus.ATTENDING) {
                  if (!acc[eventId]) {
                    acc[eventId] = [];
                  }
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

          Object.entries(subGuestsByEvent).forEach(([eventId, names]) => {
            initialAdditionalGuestNames[eventId] = names;
          });
        }

        setAdditionalGuestNames(initialAdditionalGuestNames);

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
        onError?.(errorMessage);
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
        
        setGuest({ ...guest, subGuests: updatedSubGuests });
        updateDoc(doc(db, 'guests', guest.id), { subGuests: updatedSubGuests })
          .then(() => {
            toast({
              title: "RSVP saved successfully",
              variant: "success",
            });
          })
          .catch(error => {
            setGuest(guest);
            throw error;
          });
      } else {
        const updatedRsvps = { ...guest.rsvps, [eventId]: response };
        const updatedAdditionalRsvps = { ...guest.additionalRsvps };
        
        if (response !== RsvpStatus.ATTENDING) {
          delete updatedAdditionalRsvps[eventId];
        }
        
        setGuest({
          ...guest,
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps
        });
        updateDoc(doc(db, 'guests', guest.id), {
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps
        })
          .then(() => {
            toast({
              title: "RSVP saved successfully",
              variant: "success",
            });
          })
          .catch(error => {
            setGuest(guest);
            throw error;
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

  const handleAdditionalGuestCountChange = (eventId: EventId, count: number) => {
    if (!guest) return;
    
    const maxAdditionalGuests = guest.additionalGuests?.[eventId] ?? 0;
    const validatedCount = Math.min(count, maxAdditionalGuests);
    
    const updatedGuest = {
      ...guest,
      additionalRsvps: { ...guest.additionalRsvps, [eventId]: validatedCount }
    };
    
    setGuest(updatedGuest);
    updateDoc(doc(db, 'guests', guest.id), { additionalRsvps: updatedGuest.additionalRsvps })
      .then(() => {
        toast({
          title: "RSVP saved successfully",
          variant: "success",
        });
      })
      .catch(error => {
        setGuest(guest);
        console.error('Error updating additional guests:', error);
        setError('Failed to update additional guests. Please try again.');
        toast({
          title: "Failed to update additional guests",
          variant: "destructive",
        });
      });
  };

  const handleAdditionalGuestNameChange = (eventId: EventId, index: number, firstName: string, lastName: string) => {
    if (!guest) return;

    setAdditionalGuestNames(prev => {
      const currentNames = prev[eventId] || [];
      const newNames = [...currentNames];
      newNames[index] = { firstName, lastName };
      return {
        ...prev,
        [eventId]: newNames
      };
    });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const shouldProcessNames = guest.rsvps[eventId] === RsvpStatus.ATTENDING || guest.subGuests.some(subGuest => !subGuest.assignedByGuest && subGuest.rsvps[eventId] === RsvpStatus.ATTENDING);

    debounceTimerRef.current = setTimeout(() => {
      if (shouldProcessNames) {
        setSaving(true);
        
        setAdditionalGuestNames(currentNames => {
          const additionalNames = currentNames[eventId] || [];
          const maxAdditionalGuests = guest.additionalGuests?.[eventId] ?? 0;
          let updatedSubGuests = [...guest.subGuests];

          const allAdditionalNames = Object.values(currentNames).flat();
          updatedSubGuests = updatedSubGuests.filter(sg => {
            if (!sg.assignedByGuest) return true;
            
            return allAdditionalNames.some(name => 
              name.firstName.toLowerCase() === sg.firstName.toLowerCase() && 
              name.lastName.toLowerCase() === sg.lastName.toLowerCase()
            );
          });

          additionalNames.forEach((name, index) => {
            if (index < maxAdditionalGuests && name.firstName.trim() && name.lastName.trim()) {
              const existingSubGuest = updatedSubGuests.find(sg => 
                sg.assignedByGuest && 
                sg.firstName.toLowerCase() === name.firstName.trim().toLowerCase() && 
                sg.lastName.toLowerCase() === name.lastName.trim().toLowerCase()
              );

              if (existingSubGuest) {
                existingSubGuest.rsvps[eventId] = RsvpStatus.ATTENDING;
              } else {
                const newSubGuest: SubGuest = {
                  id: `${guest.id}-${eventId}-${index}-${Date.now()}`,
                  firstName: name.firstName.trim(),
                  lastName: name.lastName.trim(),
                  rsvps: { [eventId]: RsvpStatus.ATTENDING },
                  assignedByGuest: true
                };
                updatedSubGuests.push(newSubGuest);

                updatedSubGuests = updatedSubGuests.map(sg => {
                  if (sg.assignedByGuest && 
                      sg.rsvps[eventId] === RsvpStatus.ATTENDING && 
                      (sg.firstName.toLowerCase() !== name.firstName.trim().toLowerCase() || 
                       sg.lastName.toLowerCase() !== name.lastName.trim().toLowerCase())) {
                    const remainingRsvps = { ...sg.rsvps };
                    delete remainingRsvps[eventId];
                    return { ...sg, rsvps: remainingRsvps };
                  }
                  return sg;
                });
              }
            }
          });

          setGuest(prev => ({ ...prev!, subGuests: updatedSubGuests }));

          const hasIncompleteNames = additionalNames.some(name => 
            index < maxAdditionalGuests && 
            (!name.firstName.trim() || !name.lastName.trim())
          );

          updateDoc(doc(db, 'guests', guest.id), { subGuests: updatedSubGuests })
            .then(() => {
              if (hasIncompleteNames) {
                toast({
                  title: "Please complete all guest names",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Guest information saved successfully",
                  variant: "success",
                });
              }
            })
            .catch(error => {
              setGuest(prev => ({ ...prev!, subGuests: guest.subGuests }));
              console.error('Error updating guest names:', error);
              toast({
                title: "Failed to save guest information",
                variant: "destructive",
              });
            })
            .finally(() => {
              setSaving(false);
            });

          return currentNames;
        });
      }
    }, 500);
  };

  const confirmRSVP = async () => {
    if (!guest) return;

    try {
      setSaving(true);
      
      await updateDoc(doc(db, 'guests', guest.id), {
        rsvps: guest.rsvps,
        additionalRsvps: guest.additionalRsvps,
        subGuests: guest.subGuests
      });

      toast({
        title: "RSVP confirmed successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error confirming RSVP:', error);
      setError('Failed to confirm RSVP. Please try again.');
      toast({
        title: "Failed to confirm RSVP",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    guest,
    events,
    loading,
    saving,
    error,
    additionalGuestNames,
    isCompleted,
    handleRSVP,
    handleAdditionalGuestCountChange,
    handleAdditionalGuestNameChange,
    confirmRSVP
  };
} 