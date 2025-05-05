import { Guest, Event, RsvpStatus } from '@/src/models/interfaces';
import { useState, useEffect } from 'react';

interface RsvpEventCardProps {
  event: Event;
  guest: Guest;
  onRSVP: (guestId: string, eventId: string, response: string, isSubGuest: boolean) => Promise<void>;
  onAdditionalGuestsChange: (eventId: string, count: number) => void;
  saving: boolean;
  additionalGuestsCount: Record<string, number>;
}

export function RsvpEventCard({ 
  event, 
  guest, 
  onRSVP, 
  onAdditionalGuestsChange,
  saving,
  additionalGuestsCount 
}: RsvpEventCardProps) {
  const hasSubGuests = guest.subGuests && guest.subGuests.length > 0;
  const [showingAdditionalGuests, setShowingAdditionalGuests] = useState<string | null>(null);

  // Update which guest should show additional guests dropdown
  useEffect(() => {
    const maxAdditionalGuests = guest?.additionalGuests?.[event.id] ?? 0;
    if (maxAdditionalGuests === 0) {
      setShowingAdditionalGuests(null);
      return;
    }

    // Check main guest first
    if (guest.rsvps[event.id] === RsvpStatus.ATTENDING) {
      setShowingAdditionalGuests(guest.id);
      return;
    }

    // Then check sub-guests in order
    const attendingSubGuest = guest.subGuests?.find(subGuest => 
      subGuest.rsvps[event.id] === RsvpStatus.ATTENDING
    );
    
    if (attendingSubGuest) {
      setShowingAdditionalGuests(attendingSubGuest.id);
    } else {
      setShowingAdditionalGuests(null);
    }
  }, [guest, event.id]);

  const renderRSVPButtons = (guestId: string, rsvps: Record<string, string>, eventId: string, isSubGuest: boolean = false) => {
    const maxAdditionalGuests = guest?.additionalGuests?.[eventId] ?? 0;
    const currentAdditionalGuests = additionalGuestsCount[eventId] ?? 0;
    const isShowingAdditionalGuests = showingAdditionalGuests === guestId;

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="flex space-x-4">
            <button
              onClick={() => onRSVP(guestId, eventId, RsvpStatus.ATTENDING, isSubGuest)}
              disabled={saving}
              className={`px-4 py-2 rounded transition-colors duration-200 ${
                rsvps[eventId] === RsvpStatus.ATTENDING
                  ? 'bg-green-600 text-white'
                  : 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)] hover:bg-pink-200 border border-[var(--blossom-border)]'
              }`}
            >
              Attending
            </button>
            <button
              onClick={() => onRSVP(guestId, eventId, RsvpStatus.NOT_ATTENDING, isSubGuest)}
              disabled={saving}
              className={`px-4 py-2 rounded transition-colors duration-200 ${
                rsvps[eventId] === RsvpStatus.NOT_ATTENDING
                  ? 'bg-red-600 text-white'
                  : 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)] hover:bg-pink-200 border border-[var(--blossom-border)]'
              }`}
            >
              Not Attending
            </button>
          </div>
        </div>
        {maxAdditionalGuests > 0 && rsvps[eventId] === RsvpStatus.ATTENDING && isShowingAdditionalGuests && (
          <div className="mt-6 p-4 bg-[var(--blossom-pink-light)] rounded-lg border border-[var(--blossom-border)]">
            <div className="flex flex-col items-center space-y-3">
              <h4 className="text-lg font-medium text-[var(--blossom-text-dark)]">Additional Guests</h4>
              <p className="text-sm text-[var(--blossom-text-light)] text-center">
                You can bring up to {maxAdditionalGuests} additional guest{maxAdditionalGuests > 1 ? 's' : ''} to this event.
              </p>
              <div className="flex items-center space-x-3">
                <label className="text-[var(--blossom-text-dark)] font-medium">Number of additional guests:</label>
                <select
                  value={currentAdditionalGuests}
                  onChange={(e) => onAdditionalGuestsChange(eventId, parseInt(e.target.value))}
                  className="px-3 py-2 border border-[var(--blossom-border)] rounded text-[var(--blossom-text-dark)] bg-white focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)]"
                >
                  {[...Array(maxAdditionalGuests + 1)].map((_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-[var(--blossom-border)] transition-all duration-200 hover:shadow-md">
      <h3 className="text-xl font-bold text-[var(--blossom-text-dark)] mb-4 text-center">{event.name}</h3>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center text-[var(--blossom-text-light)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--blossom-pink-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="italic">{formatEventDateTime(event)}</span>
        </div>
        <div className="flex items-center text-[var(--blossom-text-light)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--blossom-pink-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{event.location}</span>
        </div>
      </div>
      
      {event.description && (
        <p className="text-[var(--blossom-text-light)] mb-4 text-sm">{event.description}</p>
      )}

      {event.additionalFields && Object.keys(event.additionalFields).length > 0 && (
        <div className="mb-4 p-3 bg-[var(--blossom-pink-light)]/30 rounded-lg">
          <div className="space-y-2">
            {Object.entries(event.additionalFields).map(([key, value]) => (
              <div key={key} className="flex text-sm">
                <span className="text-[var(--blossom-text-light)]">{key}</span>
                {value && value !== '' && <span className="text-[var(--blossom-text-dark)] font-medium">: {value}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-8 pb-4">
        <div className="space-y-2">
          {hasSubGuests && (
            <h4 className="text-[var(--blossom-text-dark)] font-medium text-center">
              {guest.firstName} {guest.lastName}
            </h4>
          )}
          <div className="flex justify-center">
            {renderRSVPButtons(guest.id, guest.rsvps, event.id)}
          </div>
        </div>

        {(guest.subGuests || [])
          .filter(subGuest => subGuest.rsvps[event.id] !== undefined)
          .map((subGuest, index, array) => (
            <div 
              key={subGuest.id} 
              className={`space-y-2 border-t border-[var(--blossom-border)] pt-6 ${
                index === array.length - 1 ? 'pb-1' : ''
              }`}
            >
              <h4 className="text-[var(--blossom-text-dark)] font-medium text-center">
                {subGuest.firstName} {subGuest.lastName}
              </h4>
              <div className="flex justify-center">
                {renderRSVPButtons(subGuest.id, subGuest.rsvps, event.id, true)}
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}

// Helper to format timestamp or date/time
const formatEventDateTime = (event: Event): string => {
  if (event.startDateTime) {
    try {
      if (typeof event.startDateTime === 'object' && 'toDate' in event.startDateTime && typeof event.startDateTime.toDate === 'function') {
        return event.startDateTime.toDate().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      
      if (event.startDateTime instanceof Date) {
        return event.startDateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      
      if (typeof event.startDateTime === 'number' || typeof event.startDateTime === 'string') {
        const date = new Date(event.startDateTime);
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
  }
  
  return "Sunday, August 10th, 2025, 7:00 PM";
}; 