"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOccasionManagement } from "@/src/hooks/useOccasionManagement";
import { useEventManagement } from "@/src/hooks/useEventManagement";
import { useGuestManagement } from "@/src/hooks/useGuestManagement";
import { useTagManagement } from "@/src/hooks/useTagManagement";
import RSVPStatsForEvent from "@/src/components/RSVPs/RSVPStatsForEvent/RSVPStatsForEvent";
import OccasionRSVPTable from "@/src/components/RSVPs/OccasionRSVPTable/OccasionRSVPTable";
import SimpleTagSelector from "@/src/components/Tags/SimpleTagSelector/SimpleTagSelector";
import { useRSVPStats } from "@/src/hooks/useRSVPStats";

export default function OccasionStatusView() {
  const searchParams = useSearchParams();
  const alias = searchParams.get("a");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {
    occasion,
    loading: occasionLoading,
    error: occasionError,
  } = useOccasionManagement({ alias, useContext: false });

  const { events, loading: eventsLoading } = useEventManagement({
    occasionId: occasion?.id,
    useContext: false,
  });

  const { guests, loading: guestsLoading } = useGuestManagement({
    occasionId: occasion?.id,
    useContext: false,
  });

  const {
    events: rsvpEvents,
    guests: rsvpGuests,
    loading: rsvpLoading,
    getEventStats,
  } = useRSVPStats({ occasionId: occasion?.id });

  const { tags, loading: tagsLoading } = useTagManagement({
    occasionId: occasion?.id,
    useContext: false,
    guests: guests || rsvpGuests || [],
  });

  const loading =
    occasionLoading ||
    eventsLoading ||
    guestsLoading ||
    rsvpLoading ||
    tagsLoading;

  // Filter guests based on selected tags
  const getFilteredGuests = () => {
    const displayGuests = guests?.length > 0 ? guests : rsvpGuests || [];

    // If no tags are selected (empty array), show all guests
    if (selectedTagIds.length === 0) {
      return displayGuests;
    }

    // Separate untagged and specific tag selections
    const hasUntagged = selectedTagIds.includes("untagged");
    const actualTagIds = selectedTagIds.filter((id) => id !== "untagged");

    return displayGuests.filter((guest) => {
      const hasNoTags = !guest.tags || guest.tags.length === 0;
      const hasSelectedTags =
        actualTagIds.length > 0 &&
        guest.tags &&
        guest.tags.some((tagId) => actualTagIds.includes(tagId));

      // If untagged is selected, include guests with no tags
      if (hasUntagged && hasNoTags) {
        return true;
      }

      // If specific tags are selected, include guests with those tags
      if (actualTagIds.length > 0 && hasSelectedTags) {
        return true;
      }

      return false;
    });
  };

  const filteredGuests = getFilteredGuests();

  // const filteredGuestCount = filteredGuests.reduce((acc, guest) => {
  //   return acc + 1 + (guest.subGuests?.length || 0);
  // }, 0);

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

  return (
    <div className="space-y-8">
      {/* Tag Filtering Section */}
      <div className="bg-white rounded-lg border border-[var(--blossom-border)] p-6">
        <SimpleTagSelector
          tags={tags}
          selectedTagIds={selectedTagIds}
          onSelectionChange={setSelectedTagIds}
          showUntagged={true}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {displayEvents.map((event) => (
          <div key={event.id} className="flex-1 min-w-[300px] max-w-[400px]">
            <RSVPStatsForEvent
              event={event}
              stats={getEventStats(event.id, selectedTagIds)}
            />
          </div>
        ))}
      </div>

      <OccasionRSVPTable
        guests={filteredGuests}
        events={displayEvents}
        isLoading={loading}
      />
    </div>
  );
}
