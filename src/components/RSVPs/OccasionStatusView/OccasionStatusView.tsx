'use client';

import { useSearchParams } from 'next/navigation';
import { useOccasionManagement } from '@/src/hooks/useOccasionManagement';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import { useGuestManagement } from '@/src/hooks/useGuestManagement';
import RSVPStatsForEvent from '@/src/components/RSVPs/RSVPStatsForEvent/RSVPStatsForEvent';
import OccasionRSVPTable from '@/src/components/RSVPs/OccasionRSVPTable/OccasionRSVPTable';
import { useRSVPStats } from '@/src/hooks/useRSVPStats';

export default function OccasionStatusView() {
  const searchParams = useSearchParams();
  const alias = searchParams.get('a');
  
  const { 
    occasion, 
    loading: occasionLoading, 
    error: occasionError 
  } = useOccasionManagement({ alias, useContext: false });
  
  const { 
    events, 
    loading: eventsLoading 
  } = useEventManagement({ 
    occasionId: occasion?.id,
    useContext: false 
  });
  
  const { 
    guests, 
    loading: guestsLoading 
  } = useGuestManagement({ 
    occasionId: occasion?.id,
    useContext: false 
  });

  const { 
    events: rsvpEvents, 
    guests: rsvpGuests, 
    loading: rsvpLoading,
    getEventStats
  } = useRSVPStats({ occasionId: occasion?.id });

  const loading = occasionLoading || eventsLoading || guestsLoading || rsvpLoading;

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--blossom-pink-primary)]"></div>
      </div>
    );
  }

  if (occasionError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{occasionError}</p>
      </div>
    );
  }

  if (!occasion || !events || !guests) {
    return (
      <div className="text-center p-6">
        <p className="text-[var(--blossom-text-dark)]/70">No data available</p>
      </div>
    );
  }

  const displayEvents = events.length > 0 ? events : rsvpEvents;
  const displayGuests = guests.length > 0 ? guests : rsvpGuests;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-6">
        {displayEvents.map((event) => (
          <div key={event.id} className="flex-1 min-w-[300px] max-w-[400px]">
            <RSVPStatsForEvent
              event={event}
              stats={getEventStats(event.id)}
            />
          </div>
        ))}
      </div>

      <OccasionRSVPTable
        guests={displayGuests}
        events={displayEvents}
        isLoading={loading}
      />
    </div>
  );
} 