import { Guest, Event, RsvpStatus } from '@/src/models/interfaces';
import { Button } from '@/src/components/ui/button';
import { Calendar } from 'lucide-react';
import { formatEventDate, formatEventTime } from '@/src/utils/dateUtils';
import { downloadICSFile } from '@/src/utils/calendarUtils';

interface RsvpConfirmationProps {
  guest: Guest;
  events: Event[];
}

export function RsvpConfirmation({ guest, events }: RsvpConfirmationProps) {
  const attendingEvents = events.filter(event => {
    const mainGuestAttending = guest.rsvps[event.id] === RsvpStatus.ATTENDING;
    const subGuestsAttending = guest.subGuests.some(
      subGuest => subGuest.rsvps[event.id] === RsvpStatus.ATTENDING
    );
    const additionalGuestsAttending = (guest.additionalRsvps?.[event.id] || 0) > 0;
    
    return mainGuestAttending || subGuestsAttending || additionalGuestsAttending;
  });

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-lg p-4 md:p-5 mb-6 md:mb-8 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-[var(--blossom-text-dark)] text-center">
          Thank You for Your RSVP!
        </h2>
        
        <p className="text-sm md:text-base text-[var(--blossom-text-light)] mb-6 text-center">
          We&apos;re looking forward to celebrating with you. Here&apos;s a summary of the events you&apos;ll be attending:
        </p>

        <div className="space-y-4">
          {attendingEvents.map(event => (
            <div key={event.id} className="border border-[var(--blossom-pink-light)] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-[var(--blossom-text-dark)] mb-2">
                {event.name}
              </h3>
              
              <div className="text-sm text-[var(--blossom-text-light)] space-y-1 mb-3">
                <p>
                  <strong>Date:</strong> {formatEventDate(event.date)}
                </p>
                <p>
                  <strong>Time:</strong> {formatEventTime(event.time)}
                </p>
                {event.location && (
                  <p>
                    <strong>Location:</strong> {event.location}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white border-none"
                onClick={() => downloadICSFile(event)}
              >
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </Button>
            </div>
          ))}
        </div>

        <p className="text-sm md:text-base text-[var(--blossom-text-light)] mt-6 text-center">
          Need to modify your response? Simply refresh this page to make any adjustments.
        </p>
      </div>
    </div>
  );
}
