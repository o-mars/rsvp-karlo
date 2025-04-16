'use client';

import { Guest, Event } from '@/src/models/interfaces';
import EventSeriesRSVPTableRow from '../EventSeriesRSVPTableRow/EventSeriesRSVPTableRow';

interface EventSeriesRSVPTableProps {
  guests: Guest[];
  events: Event[];
  isLoading?: boolean;
}

export default function EventSeriesRSVPTable({ 
  guests, 
  events, 
  isLoading = false 
}: EventSeriesRSVPTableProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-800 shadow rounded-lg p-6 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (guests.length === 0 || events.length === 0) {
    return (
      <div className="bg-slate-800 shadow rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-white">No data available</h2>
        <p className="text-slate-400 mt-2">There are no guests or events to display</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Guest List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
              {events.map((event) => (
                <th key={event.id} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {event.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {guests.map((guest) => (
              <EventSeriesRSVPTableRow
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