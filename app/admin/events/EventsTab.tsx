'use client';

import { useState } from 'react';
import { useEventSeries } from '../../../src/contexts/EventSeriesContext';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import EventCard from '@/src/components/Events/EventCard/EventCard';
import CreateOrUpdateEventCard from '@/src/components/Events/CreateOrUpdateEventCard/CreateOrUpdateEventCard';
import { Event } from '@/src/models/interfaces';

export default function EventsTab() {
  const { eventSeries } = useEventSeries();

  const { 
    events, 
    loading, 
    editingEvent, 
    setEditingEvent,
    fetchData
  } = useEventManagement();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set form fields when editing an event
  const startEditing = (event: Event) => {
    console.log('startEditing', event);
    setEditingEvent(event);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <>
      <div className="bg-slate-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Events</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Event
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-2 text-slate-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">No events yet</p>
            <p className="mt-1">Create your first event to get started</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={startEditing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Use the CreateOrUpdateEventCard component for event creation/editing */}
      <CreateOrUpdateEventCard
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onComplete={fetchData}
        editingEvent={editingEvent}
        eventSeriesId={eventSeries?.id || ''}
        eventSeriesAlias={eventSeries?.alias || ''}
      />
    </>
  );
} 