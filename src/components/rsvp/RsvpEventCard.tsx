import { Guest, Event, RsvpStatus, EventId, RSVPStatus, GuestId } from '@/src/models/interfaces';
import { useState, useEffect } from 'react';
import ImagePreviewModal from '@/src/components/shared/ImagePreviewModal';
import { formatEventDate, formatEventTime } from '@/src/utils/dateUtils';
import { downloadICSFile } from '@/src/utils/calendarUtils';

interface RsvpEventCardProps {
  event: Event;
  guest: Guest;
  onRSVP: (guestId: GuestId, eventId: EventId, response: RSVPStatus, isSubGuest: boolean) => Promise<void>;
  onAdditionalGuestsChange: (eventId: EventId, count: number) => void;
  // onAdditionalGuestNameChange: (eventId: EventId, index: number, firstName: string, lastName: string) => void;
  saving: boolean;
  additionalGuestsCount: Record<EventId, number>;
  // additionalGuestNames: Record<EventId, Array<{ firstName: string; lastName: string }>>;
  isAdmin?: boolean;
}

export function RsvpEventCard({
  event,
  guest,
  onRSVP,
  onAdditionalGuestsChange,
  // onAdditionalGuestNameChange,
  saving,
  additionalGuestsCount,
  // additionalGuestNames,
  isAdmin = false,
}: RsvpEventCardProps) {
  const hasSubGuests = guest.subGuests && guest.subGuests.length > 0;
  const [showingAdditionalGuests, setShowingAdditionalGuests] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

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
    const currentStatus = rsvps[eventId];
    // const currentAdditionalGuestNames = additionalGuestNames[eventId] || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="flex space-x-4">
            <button
              onClick={() => onRSVP(
                guestId, 
                eventId, 
                isAdmin && currentStatus === RsvpStatus.ATTENDING ? RsvpStatus.AWAITING_RESPONSE : RsvpStatus.ATTENDING, 
                isSubGuest
              )}
              disabled={saving}
              className={`px-4 py-2 rounded transition-colors duration-200 ${
                currentStatus === RsvpStatus.ATTENDING
                  ? 'bg-green-600 text-white'
                  : 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)] hover:bg-pink-200 border border-[var(--blossom-border)]'
              }`}
            >
              Attending
            </button>
            <button
              onClick={() => onRSVP(
                guestId, 
                eventId, 
                isAdmin && currentStatus === RsvpStatus.NOT_ATTENDING ? RsvpStatus.AWAITING_RESPONSE : RsvpStatus.NOT_ATTENDING, 
                isSubGuest
              )}
              disabled={saving}
              className={`px-4 py-2 rounded transition-colors duration-200 ${
                currentStatus === RsvpStatus.NOT_ATTENDING
                  ? 'bg-red-600 text-white'
                  : 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)] hover:bg-pink-200 border border-[var(--blossom-border)]'
              }`}
            >
              Not Attending
            </button>
          </div>
        </div>
        {maxAdditionalGuests > 0 && currentStatus === RsvpStatus.ATTENDING && isShowingAdditionalGuests && (
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
      
      {event.inviteImageUrl && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 text-[var(--blossom-pink-primary)] hover:text-[var(--blossom-pink-hover)] border border-[var(--blossom-pink-primary)] hover:border-[var(--blossom-pink-hover)] rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            View Invitation
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center text-[var(--blossom-text-light)]">
          <button
            onClick={() => downloadICSFile(event)}
            className="flex items-center hover:text-[var(--blossom-pink-primary)] transition-colors cursor-pointer"
            title="Add to Calendar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--blossom-pink-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="italic">{formatEventDate(event.date)} at {formatEventTime(event.time)}</span>
          </button>
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
        <div className="text-[var(--blossom-text-light)] mb-4 text-sm whitespace-pre-wrap">{event.description}</div>
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
          .filter(subGuest => 
            subGuest.rsvps[event.id] !== undefined && 
            !subGuest.assignedByGuest // Filter out guest-assigned sub-guests
          )
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

      {event.inviteImageUrl && (
        <ImagePreviewModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          imageUrl={event.inviteImageUrl}
          alt="Event invitation"
        />
      )}
    </div>
  );
}
