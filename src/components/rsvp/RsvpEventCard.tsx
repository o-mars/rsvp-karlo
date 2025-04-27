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
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-[var(--blossom-text-dark)]">How many additional guests will you be bringing?</label>
              <select
                value={currentAdditionalGuests}
                onChange={(e) => onAdditionalGuestsChange(eventId, parseInt(e.target.value))}
                className="px-2 py-1 border border-[var(--blossom-border)] rounded text-sm text-[var(--blossom-text-dark)] bg-white"
              >
                {[...Array(maxAdditionalGuests + 1)].map((_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-[var(--blossom-border)] transition-all duration-200 hover:shadow-md">
      <h3 className="text-lg font-medium text-[var(--blossom-text-dark)] mb-2">{event.name}</h3>
      <p className="text-[var(--blossom-text-light)] mb-2 italic">{formatEventDateTime(event)}</p>
      <p className="text-[var(--blossom-text-light)] mb-4">{event.location}</p>
      
      {event.description && (
        <p className="text-[var(--blossom-text-light)] mb-8 text-sm">{event.description}</p>
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