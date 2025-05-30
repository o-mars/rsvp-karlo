import { useCallback } from 'react';
import { RsvpEventCard } from './RsvpEventCard';
import { Toaster } from '@/src/components/ui/toaster';
import { useGuestRsvp } from '@/src/hooks/useGuestRsvp';

interface RsvpContentProps {
  guestId: string;
  onError: (error: string) => void;
}

export function RsvpContent({ guestId, onError }: RsvpContentProps) {
  const {
    guest,
    events,
    loading,
    saving,
    error,
    handleRSVP,
    handleAdditionalGuestCountChange,
    handleAdditionalGuestNameChange,
    additionalGuestNames
  } = useGuestRsvp({ guestId, onError });

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
                guest={guest}
                saving={saving}
                handleRSVP={handleRSVP}
                handleAdditionalGuestCountChange={handleAdditionalGuestCountChange}
                handleAdditionalGuestNameChange={handleAdditionalGuestNameChange}
                additionalGuestNames={additionalGuestNames}
              />
            ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
} 



