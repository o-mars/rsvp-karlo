'use client';

import { Guest, Event } from '@/src/models/interfaces';

interface EventSeriesRSVPTableRowProps {
  guest: Guest;
  events: Event[];
}

export default function EventSeriesRSVPTableRow({ guest, events }: EventSeriesRSVPTableRowProps) {
  // Get the appropriate style class for a given RSVP status
  const getRsvpStatusClass = (status: string | undefined) => {
    switch (status) {
      case 'yes':
        return 'bg-green-900 text-green-300';
      case 'no':
        return 'bg-red-900 text-red-300';
      case 'pending':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-slate-900 text-slate-300';
    }
  };

  return (
    <tr className="hover:bg-slate-700">
      <td className="px-6 py-4 whitespace-nowrap text-white">
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