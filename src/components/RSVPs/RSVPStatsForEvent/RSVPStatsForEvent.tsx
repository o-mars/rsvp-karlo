'use client';

import { Event, EventStats } from '@/src/models/interfaces';


interface RSVPStatsForEventProps {
  event: Event;
  stats: EventStats;
}

export default function RSVPStatsForEvent({ event, stats }: RSVPStatsForEventProps) {
  return (
    <div className="bg-white border border-[var(--blossom-border)] shadow-[var(--blossom-card-shadow)] p-4 rounded-lg">
      <h3 className="text-lg font-medium text-[var(--blossom-text-dark)] mb-2">{event.name}</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-[var(--blossom-text-dark)]/70">
          <span>Total Guests:</span>
          <span className="font-medium">{stats.totalGuests}</span>
        </div>
        <div className="flex justify-between text-[var(--blossom-text-dark)]/70">
          <span>Invited:</span>
          <span className="font-medium">{stats.invited}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Attending:</span>
          <span className="font-medium">{stats.attending}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Not Attending:</span>
          <span className="font-medium">{stats.notAttending}</span>
        </div>
        <div className="flex justify-between text-yellow-600">
          <span>Pending Response:</span>
          <span className="font-medium">{stats.pending}</span>
        </div>
        <div className="flex justify-between text-[var(--blossom-text-dark)]/50">
          <span>Not Invited:</span>
          <span className="font-medium">{stats.notInvited}</span>
        </div>
      </div>
    </div>
  );
} 