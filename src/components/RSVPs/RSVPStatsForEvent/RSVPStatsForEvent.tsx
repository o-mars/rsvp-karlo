'use client';

import { Event, EventStats } from '@/src/models/interfaces';


interface RSVPStatsForEventProps {
  event: Event;
  stats: EventStats;
}

export default function RSVPStatsForEvent({ event, stats }: RSVPStatsForEventProps) {
  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-2">{event.name}</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-slate-300">
          <span>Total Guests:</span>
          <span className="font-medium">{stats.totalGuests}</span>
        </div>
        <div className="flex justify-between text-blue-400">
          <span>Invited:</span>
          <span className="font-medium">{stats.invited}</span>
        </div>
        <div className="flex justify-between text-green-400">
          <span>Attending:</span>
          <span className="font-medium">{stats.attending}</span>
        </div>
        <div className="flex justify-between text-red-400">
          <span>Not Attending:</span>
          <span className="font-medium">{stats.notAttending}</span>
        </div>
        <div className="flex justify-between text-yellow-400">
          <span>Pending Response:</span>
          <span className="font-medium">{stats.pending}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Not Invited:</span>
          <span className="font-medium">{stats.notInvited}</span>
        </div>
        <div className="flex justify-between text-blue-400">
          <span>Response Rate:</span>
          <span className="font-medium">
            {stats.invited > 0
              ? `${Math.round((stats.responded / stats.invited) * 100)}%`
              : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
} 