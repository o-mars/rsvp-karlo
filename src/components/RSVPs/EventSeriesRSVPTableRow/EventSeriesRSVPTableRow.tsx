'use client';

import { Guest, Event, RsvpStatus } from '@/src/models/interfaces';

interface EventSeriesRSVPTableRowProps {
  guest: Guest;
  events: Event[];
}

export default function EventSeriesRSVPTableRow({ guest, events }: EventSeriesRSVPTableRowProps) {
  // Get the appropriate style class for a given RSVP status
  const getRsvpStatusClass = (status: string | undefined) => {
    switch (status) {
      case RsvpStatus.ATTENDING:
        return 'bg-green-100 text-green-800';
      case RsvpStatus.NOT_ATTENDING:
        return 'bg-red-100 text-red-800';
      case RsvpStatus.AWAITING_RESPONSE:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-600 text-slate-200';
    }
  };

  return (
    <tr className="hover:bg-[var(--blossom-card-bg-secondary)]">
      <td className="px-6 py-4 whitespace-nowrap text-[var(--blossom-text-dark)]">
        {guest.firstName} {guest.lastName}
      </td>
      {events.map((event) => (
        <td key={event.id} className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRsvpStatusClass(guest.rsvps[event.id])}`}>
            {guest.rsvps[event.id] || 'Not Invited'}
          </span>
        </td>
      ))}
    </tr>
  );
} 