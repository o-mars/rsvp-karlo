'use client';

import { Guest, Event } from '@/src/models/interfaces';
import RsvpStatusBadge from '@/src/components/shared/RsvpStatusBadge';

interface EventSeriesRSVPTableRowProps {
  guest: Guest;
  events: Event[];
}

export default function EventSeriesRSVPTableRow({ guest, events }: EventSeriesRSVPTableRowProps) {
  return (
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
  );
} 