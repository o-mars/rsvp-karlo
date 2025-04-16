'use client';

import RSVPStatsForEvent from '@/src/components/RSVPs/RSVPStatsForEvent/RSVPStatsForEvent';
import EventSeriesRSVPTable from '@/src/components/RSVPs/EventSeriesRSVPTable/EventSeriesRSVPTable';
import { useRSVPStats } from '@/src/hooks/useRSVPStats';
import { useEventSeries } from '@/src/contexts/EventSeriesContext';

export default function EventSeriesStatusView() {
  const { eventSeries, events, guests, loading } = useEventSeries();
  
  // Use our custom hook to fetch RSVP data for the current series if using context
  // or rely on the data provided by the EventSeriesContext
  const { 
    events: rsvpEvents, 
    guests: rsvpGuests, 
    loading: rsvpLoading, 
    error, 
    getEventStats 
  } = useRSVPStats({ 
    eventSeriesId: eventSeries?.id 
  });

  // Use either context data (if available) or directly fetched data
  const displayEvents = events.length > 0 ? events : rsvpEvents;
  const displayGuests = guests.length > 0 ? guests : rsvpGuests;
  const isLoading = loading || rsvpLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-800 text-white p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {eventSeries ? `${eventSeries.name} Events` : 'All Events'} Status
        </h2>
        {displayEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {displayEvents.map((event) => (
              <RSVPStatsForEvent
                key={event.id}
                event={event}
                stats={getEventStats(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p className="text-lg font-medium">No events found</p>
            <p className="mt-1">There are no events for the selected event series</p>
          </div>
        )}
      </div>

      <EventSeriesRSVPTable
        guests={displayGuests}
        events={displayEvents}
        isLoading={isLoading}
      />
    </div>
  );
} 