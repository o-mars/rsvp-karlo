import { useCallback, useState } from 'react';
import { RsvpEventCard } from './RsvpEventCard';
import { RsvpConfirmation } from './RsvpConfirmation';
import { Toaster } from '@/src/components/ui/toaster';
import { useGuestRsvp } from '@/src/hooks/useGuestRsvp';
import { Button } from '@/src/components/ui/button';

interface RsvpContentProps {
  guestId: string;
  onError: (error: string) => void;
}

export function RsvpContent({ guestId, onError }: RsvpContentProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const {
    guest,
    events,
    loading,
    saving,
    error,
    isCompleted,
    handleRSVP,
    handleAdditionalGuestCountChange,
    handleAdditionalGuestNameChange,
    additionalGuestNames,
    confirmRSVP
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

  const handleConfirm = async () => {
    try {
      await confirmRSVP();
      setIsConfirmed(true);
    } catch (error) {
      // Error is already handled in confirmRSVP
      console.error('Failed to confirm RSVP:', error);
    }
  };

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

  if (isConfirmed) {
    return <RsvpConfirmation guest={guest} events={events} />;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-lg p-4 md:p-5 mb-6 md:mb-8 shadow-xl">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-[var(--blossom-text-dark)]">
          {welcomeMessage()}
        </h2>
        <p className="text-sm md:text-base text-[var(--blossom-text-light)] mb-4 md:mb-6">
          Please let us know if you&apos;ll be joining us for the following events.
        </p>
        
        <div className="space-y-4 md:space-y-6">
          {events
            .filter(event => guest?.rsvps[event.id] !== undefined)
            .map((event, index, filteredEvents) => (
              <div key={event.id} className="relative">
                {filteredEvents.length > 1 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[var(--blossom-pink-medium)] text-white px-3 md:px-4 py-0.5 md:py-1 rounded-full text-xs md:text-sm">
                    Event {index + 1} of {filteredEvents.length}
                  </div>
                )}
                <RsvpEventCard
                  event={event}
                  guest={guest}
                  saving={saving}
                  handleRSVP={handleRSVP}
                  handleAdditionalGuestCountChange={handleAdditionalGuestCountChange}
                  handleAdditionalGuestNameChange={handleAdditionalGuestNameChange}
                  additionalGuestNames={additionalGuestNames}
                />
              </div>
            ))}
        </div>

        <div className="mt-5 flex justify-center">
          <Button
            size="lg"
            disabled={!isCompleted || saving}
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? 'Saving...' : 'Confirm RSVP'}
          </Button>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 



