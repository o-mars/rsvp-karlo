'use client';

import { Guest, Event, RsvpStatus } from '@/src/models/interfaces';
import RsvpStatusBadge from '@/src/components/shared/RsvpStatusBadge';

interface OccasionRSVPTableRowProps {
  guest: Guest;
  events: Event[];
}

export default function OccasionRSVPTableRow({ guest, events }: OccasionRSVPTableRowProps) {
  return (
    <>
      {/* Main guest row */}
      <tr className="hover:bg-[var(--blossom-card-bg-secondary)]">
        <td className="px-6 py-4 whitespace-nowrap text-[var(--blossom-text-dark)]">
          {guest.firstName} {guest.lastName}
        </td>
        {events.map((event) => (
          <td key={event.id} className="px-6 py-4 whitespace-nowrap">
            <RsvpStatusBadge status={guest.rsvps[event.id]} />
          </td>
        ))}
      </tr>

      {/* Sub-guests rows */}
      {guest.subGuests.map((subGuest) => (
        <tr key={subGuest.id} className="hover:bg-[var(--blossom-card-bg-secondary)]">
          <td className="px-6 py-4 whitespace-nowrap text-[var(--blossom-text-dark)] pl-12">
            {subGuest.firstName} {subGuest.lastName}
          </td>
          {events.map((event) => (
            <td key={event.id} className="px-6 py-4 whitespace-nowrap">
              <RsvpStatusBadge status={subGuest.rsvps[event.id]} />
            </td>
          ))}
        </tr>
      ))}

      {/* Additional RSVPs row - only show if there are any additional RSVPs */}
      {Object.values(guest.additionalRsvps || {}).some(count => count > 0) && (
        <tr className="hover:bg-[var(--blossom-card-bg-secondary)]">
          <td className="px-6 py-4 whitespace-nowrap text-[var(--blossom-text-dark)] pl-12">
            Additional Guests
          </td>
          {events.map((event) => {
            const additionalCount = guest.additionalRsvps?.[event.id] || 0;
            return (
              <td key={event.id} className="px-6 py-4 whitespace-nowrap">
                {additionalCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <RsvpStatusBadge status={RsvpStatus.ATTENDING} />
                    <span className="text-base font-medium text-[var(--blossom-primary)] bg-[var(--blossom-card-bg-secondary)] px-2 py-0.5 rounded-full">
                      x{additionalCount}
                    </span>
                  </div>
                ) : (
                  <RsvpStatusBadge status={RsvpStatus.NOT_ATTENDING} />
                )}
              </td>
            );
          })}
        </tr>
      )}
    </>
  );
} 