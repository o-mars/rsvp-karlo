'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import CreateOrUpdateEventCard from '@/src/components/Events/CreateOrUpdateEventCard/CreateOrUpdateEventCard';
import CreateOrUpdateEventSeriesCard from '@/src/components/EventSeries/CreateOrUpdateEventSeriesCard/CreateOrUpdateEventSeriesCard';
import CreateOrUpdateGuestCard from '@/src/components/Guests/CreateOrUpdateGuestCard/CreateOrUpdateGuestCard';
import { Event, Guest } from '@/src/models/interfaces';
import { useAuth } from '../../../src/contexts/AuthContext';
import EventCard from '@/src/components/Events/EventCard/EventCard';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import GuestListTable from '@/src/components/Guests/GuestListTable/GuestListTable';
import { useGuestManagement } from '@/src/hooks/useGuestManagement';
import EventSeriesStatusView from '@/src/components/RSVPs/EventSeriesStatusView/EventSeriesStatusView';
import { useEventSeriesManagement } from '@/src/hooks/useEventSeriesManagement';

export default function EventsPage() {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [activeTab, setActiveTab] = useState('events');
  const [isEditingEventSeries, setIsEditingEventSeries] = useState(false);
  
  const searchParams = useSearchParams();
  const alias = searchParams.get('a');
  const { user } = useAuth();
  
  const { 
    eventSeries, 
    loading: eventSeriesLoading, 
    error: eventSeriesError,
    handleUpdateEventSeries
  } = useEventSeriesManagement({ alias, useContext: false });
  
  const { 
    events, 
    loading: eventsLoading, 
    handleDeleteEvent, 
    handleAddEvent, 
    handleUpdateEvent 
  } = useEventManagement({ 
    eventSeriesId: eventSeries?.id,
    useContext: false 
  });
  
  const { 
    guests, 
    selectedGuests, 
    toggleGuestSelection, 
    toggleAllSelection, 
    handleDeleteGuest, 
    handleBulkEmail,
    handleAddGuest,
    handleUpdateGuest,
    fetchData: fetchGuestData
  } = useGuestManagement({ 
    eventSeriesId: eventSeries?.id,
    useContext: false 
  });

  const handleEventSubmit = async (eventData: Partial<Event>, startDateTime: Date, endDateTime: Date | null) => {
    try {
      if (editingEvent) {
        await handleUpdateEvent({
          ...eventData,
          id: editingEvent.id,
          startDateTime: Timestamp.fromDate(startDateTime),
          ...(endDateTime ? { endDateTime: Timestamp.fromDate(endDateTime) } : {})
        });
      } else {
        await handleAddEvent({
          ...eventData,
          startDateTime: Timestamp.fromDate(startDateTime),
          ...(endDateTime ? { endDateTime: Timestamp.fromDate(endDateTime) } : {}),
          createdAt: Timestamp.fromDate(new Date())
        });
      }
      
      setEditingEvent(null);
      setIsEventModalOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    }
  };

  const handleGuestSubmit = async (guest: Partial<Guest>) => {
    try {
      if (editingGuest) {
        await handleUpdateGuest({
          ...guest,
          id: editingGuest.id
        });
      } else {
        await handleAddGuest(guest);
      }
      
      await fetchGuestData();
      setEditingGuest(null);
      setIsGuestModalOpen(false);
    } catch (error) {
      console.error('Error saving guest:', error);
      alert('Failed to save guest');
    }
  };

  const loading = eventSeriesLoading || eventsLoading;

  if (loading) return (
    <div className="p-8 text-[var(--blossom-text-dark)]">
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--blossom-pink-primary)]"></div>
      </div>
    </div>
  );

  if (eventSeriesError) {
    return (
      <div className="p-8 text-[var(--blossom-text-dark)]">
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{eventSeriesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-[var(--blossom-text-dark)]">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/admin" className="text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Occasions
          </Link>
        </div>
        
        {eventSeries && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">{eventSeries.name}</h1>
              <button 
                onClick={() => setIsEditingEventSeries(true)}
                className="text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)] flex items-center text-sm bg-[var(--blossom-pink-light)] hover:bg-[var(--blossom-pink-medium)] px-3 py-1 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Occasion
              </button>
            </div>
            {eventSeries.description && (
              <p className="text-[var(--blossom-text-dark)]/70">{eventSeries.description}</p>
            )}
          </div>
        )}
        
        {/* Tabs Navigation */}
        <div className="border-b border-[var(--blossom-border)] mb-6">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-md ${
                activeTab === 'events' 
                  ? 'border-[var(--blossom-pink-primary)] text-[var(--blossom-pink-primary)]' 
                  : 'border-transparent text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)]'
              }`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-md ${
                activeTab === 'guests' 
                  ? 'border-[var(--blossom-pink-primary)] text-[var(--blossom-pink-primary)]' 
                  : 'border-transparent text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)]'
              }`}
              onClick={() => setActiveTab('guests')}
            >
              Guests
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-md ${
                activeTab === 'rsvp' 
                  ? 'border-[var(--blossom-pink-primary)] text-[var(--blossom-pink-primary)]' 
                  : 'border-transparent text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)]'
              }`}
              onClick={() => setActiveTab('rsvp')}
            >
              RSVP
            </button>
          </div>
        </div>
      </div>

      {/* Events Tab Content */}
      {activeTab === 'events' && (
        <div className="bg-[var(--blossom-card-bg-tertiary)] border border-[var(--blossom-border)] shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Events</h2>
            <button 
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white py-1.5 px-3 rounded transition-colors flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Event
            </button>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-8 text-[var(--blossom-text-dark)]/70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-[var(--blossom-text-dark)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">No events yet</p>
              <p className="mt-1">Create your first event to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEdit={() => {
                    setEditingEvent(event);
                    setIsEventModalOpen(true);
                  }} 
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Guests Tab Content */}
      {activeTab === 'guests' && (
        <GuestListTable
          guests={guests}
          events={events}
          selectedGuests={selectedGuests}
          isLoading={loading}
          onSelectGuest={(id) => toggleGuestSelection(id)}
          onSelectAll={toggleAllSelection}
          onEditGuest={setEditingGuest}
          onDeleteGuest={handleDeleteGuest}
          onBulkEmail={handleBulkEmail}
          onImportGuests={() => console.log('Import guests clicked: TODO')}
          onExportGuests={() => console.log('Export guests clicked: TODO')}
          onAddGuest={() => setIsGuestModalOpen(true)}
        />
      )}
      
      {/* RSVP Tab Content */}
      {activeTab === 'rsvp' && (
        <EventSeriesStatusView />
      )}

      {/* Add/Edit Event Modal */}
      <CreateOrUpdateEventCard
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleEventSubmit}
        editingEvent={editingEvent}
        eventSeriesId={eventSeries?.id || ''}
        eventSeriesAlias={alias || ''}
      />
      
      {/* Add/Edit Guest Modal */}
      <CreateOrUpdateGuestCard
        isOpen={isGuestModalOpen || editingGuest !== null}
        onClose={() => {
          setIsGuestModalOpen(false);
          setEditingGuest(null);
        }}
        guest={editingGuest}
        events={events}
        onSubmit={handleGuestSubmit}
      />
      
      {/* Edit Event Series Modal */}
      {user && (
        <CreateOrUpdateEventSeriesCard
          isOpen={isEditingEventSeries}
          onClose={() => setIsEditingEventSeries(false)}
          onSubmit={handleUpdateEventSeries}
          editingEventSeries={eventSeries}
          userId={user.uid}
        />
      )}
    </div>
  );
} 