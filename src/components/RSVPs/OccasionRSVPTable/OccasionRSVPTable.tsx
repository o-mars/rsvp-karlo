'use client';

import { Guest, Event } from '@/src/models/interfaces';
import OccasionRSVPTableRow from '../OccasionRSVPTableRow/OccasionRSVPTableRow';

interface OccasionRSVPTableProps {
  guests: Guest[];
  events: Event[];
  isLoading?: boolean;
}

export default function OccasionRSVPTable({ 
  guests, 
  events, 
  isLoading = false 
}: OccasionRSVPTableProps) {
  if (isLoading) {
    return (
      <div className="bg-[var(--blossom-card-bg-primary)] border border-[var(--blossom-border)] shadow-[var(--blossom-card-shadow)] rounded-lg p-6 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--blossom-pink-primary)]"></div>
      </div>
    );
  }

  if (guests.length === 0 || events.length === 0) {
    return (
      <div className="bg-[var(--blossom-card-bg-primary)] border border-[var(--blossom-border)] shadow-[var(--blossom-card-shadow)] rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-[var(--blossom-text-dark)]">No data available</h2>
        <p className="text-[var(--blossom-text-dark)]/70 mt-2">There are no guests or events to display</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--blossom-card-bg-primary)] border border-[var(--blossom-border)] shadow-[var(--blossom-card-shadow)] rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-[var(--blossom-text-dark)]">Guest List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--blossom-divider)]">
          <thead className="bg-[var(--blossom-card-bg-secondary)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--blossom-text-dark)] uppercase tracking-wider">Name</th>
              {events.map((event) => (
                <th key={event.id} className="px-6 py-3 text-left text-xs font-medium text-[var(--blossom-text-dark)] uppercase tracking-wider">
                  {event.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--blossom-card-bg-primary)] divide-y divide-[var(--blossom-divider)]">
            {guests.map((guest) => (
              <OccasionRSVPTableRow
                key={guest.id}
                guest={guest}
                events={events}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 