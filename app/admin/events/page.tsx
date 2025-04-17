'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '../../../utils/firebase';
import { collection, getDocs, doc, query, where, limit, writeBatch, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import CreateOrUpdateEventCard from '@/src/components/Events/CreateOrUpdateEventCard/CreateOrUpdateEventCard';
import CreateOrUpdateEventSeriesCard from '@/src/components/EventSeries/CreateOrUpdateEventSeriesCard/CreateOrUpdateEventSeriesCard';
import CreateOrUpdateGuestCard from '@/src/components/Guests/CreateOrUpdateGuestCard/CreateOrUpdateGuestCard';
import { Event, EventSeries as EventSeriesType, Guest } from '@/src/models/interfaces';
import { useAuth } from '../../../src/contexts/AuthContext';
import EventCard from '@/src/components/Events/EventCard/EventCard';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import GuestListTable from '@/src/components/Guests/GuestListTable/GuestListTable';
import { useGuestManagement } from '@/src/hooks/useGuestManagement';

interface EventSeries {
  id: string;
  name: string;
  alias: string;
  description?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [eventSeries, setEventSeries] = useState<EventSeries | null>(null);
  const [activeTab, setActiveTab] = useState('events');
  const [isEditingEventSeries, setIsEditingEventSeries] = useState(false);
  const [aliasDoc, setAliasDoc] = useState<{id: string, eventSeriesId: string} | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const alias = searchParams.get('a');
  const { user } = useAuth();
  const { handleDeleteEvent, handleAddEvent, handleUpdateEvent } = useEventManagement({ useContext: false });
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

  useEffect(() => {
    if (alias) {
      fetchEventSeries();
      fetchEvents();
    } else {
      router.replace('/admin');
    }
  }, [alias, router]);

  const fetchEventSeries = async () => {
    if (!alias) return;
    
    try {
      // Find the event series by alias
      const eventSeriesQuery = query(
        collection(db, 'eventSeries'), 
        where('alias', '==', alias),
        limit(1)
      );
      
      const querySnapshot = await getDocs(eventSeriesQuery);
      
      if (querySnapshot.empty) {
        router.replace('/admin');
        return;
      }
      
      // Get the first matching document
      const eventSeriesDoc = querySnapshot.docs[0];
      setEventSeries({
        id: eventSeriesDoc.id,
        ...eventSeriesDoc.data()
      } as EventSeries);
      
      // Find the alias document
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('alias', '==', alias)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      if (!aliasSnapshot.empty) {
        const aliasDocData = aliasSnapshot.docs[0];
        setAliasDoc({
          id: aliasDocData.id,
          eventSeriesId: aliasDocData.data().eventSeriesId
        });
      }
      
    } catch (error) {
      console.error('Error fetching event series:', error);
    }
  };

  const fetchEvents = async () => {
    if (!alias) return;
    
    try {
      // Query events for this event series using the alias
      const q = query(
        collection(db, 'events'),
        where('eventSeriesAlias', '==', alias)
      );
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      
      // Sort by date
      eventsList.sort((a, b) => {
        const dateA = a.startDateTime?.toMillis ? a.startDateTime.toMillis() : 0;
        const dateB = b.startDateTime?.toMillis ? b.startDateTime.toMillis() : 0;
        return dateA - dateB;
      });
      
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEventSeries = async (updatedEventSeries: Partial<EventSeriesType>) => {
    if (!eventSeries || !aliasDoc) return;
    
    try {
      // Create a batch to update both documents atomically
      const batch = writeBatch(db);
      
      // Update the event series document
      const eventSeriesRef = doc(db, 'eventSeries', eventSeries.id);
      batch.update(eventSeriesRef, updatedEventSeries);
      
      // If alias has changed, update the alias document and all events
      if (updatedEventSeries.alias && updatedEventSeries.alias !== alias && alias) {
        // Update the alias in the alias document
        const aliasDocRef = doc(db, 'aliases', aliasDoc.id);
        batch.update(aliasDocRef, { alias: updatedEventSeries.alias });
        
        // Update all events that use this alias
        const eventsQuery = query(
          collection(db, 'events'),
          where('eventSeriesAlias', '==', alias)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        
        eventsSnapshot.forEach(eventDoc => {
          batch.update(doc(db, 'events', eventDoc.id), {
            eventSeriesAlias: updatedEventSeries.alias
          });
        });
      }
      
      // Commit the batch
      await batch.commit();
      
      // Refresh data or redirect if the alias changed
      if (updatedEventSeries.alias && updatedEventSeries.alias !== alias) {
        router.push(`/admin/events/?a=${updatedEventSeries.alias}`);
      } else {
        // Update the local state
        setEventSeries(prev => prev ? { ...prev, ...updatedEventSeries } : null);
      }
      
      // Close the modal
      setIsEditingEventSeries(false);
    } catch (error) {
      console.error('Error updating event series:', error);
      alert('Failed to update event series. Please try again.');
    }
  };

  const handleEventDelete = async (id: string) => {
    try {
      await handleDeleteEvent(id);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleEventSubmit = async (eventData: Partial<Event>, startDateTime: Date, endDateTime: Date | null) => {
    try {
      if (editingEvent) {
        // For updating existing event
        await handleUpdateEvent({
          ...eventData,
          id: editingEvent.id,
          startDateTime: Timestamp.fromDate(startDateTime),
          ...(endDateTime ? { endDateTime: Timestamp.fromDate(endDateTime) } : {})
        });
      } else {
        // For creating new event
        await handleAddEvent({
          ...eventData,
          startDateTime: Timestamp.fromDate(startDateTime),
          ...(endDateTime ? { endDateTime: Timestamp.fromDate(endDateTime) } : {}),
          createdAt: Timestamp.fromDate(new Date())
        });
      }
      
      // Refresh events after adding/updating
      fetchEvents();
      
      // Reset state
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
        // For updating existing guest
        await handleUpdateGuest({
          ...guest,
          id: editingGuest.id
        });
        
        console.log('Guest updated successfully:', guest.firstName, guest.lastName);
      } else {
        // For creating new guest
        const guestId = await handleAddGuest(guest);
        
        if (guestId) {
          console.log('Guest created successfully:', guest.firstName, guest.lastName);
        }
      }
      
      // Refresh the guest data after operation
      await fetchGuestData();
      
      // Reset state
      setEditingGuest(null);
      setIsGuestModalOpen(false);
    } catch (error) {
      console.error('Error saving guest:', error);
      alert('Failed to save guest');
    }
  };

  if (loading) return (
    <div className="p-8 text-white">
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    </div>
  );

  return (
    <div className="p-8 text-white">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/admin" className="text-slate-300 hover:text-white flex items-center">
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
                className="text-slate-300 hover:text-white flex items-center text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Occasion
              </button>
            </div>
            {eventSeries.description && (
              <p className="text-slate-300">{eventSeries.description}</p>
            )}
          </div>
        )}
        
        {/* Tabs Navigation */}
        <div className="border-b border-slate-700 mb-6">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events' 
                  ? 'border-pink-500 text-pink-500' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'guests' 
                  ? 'border-pink-500 text-pink-500' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab('guests')}
            >
              Guests
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rsvp' 
                  ? 'border-pink-500 text-pink-500' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
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
        <div className="bg-slate-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Events</h2>
            <button 
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white py-1.5 px-3 rounded transition-colors flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Event
            </button>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  onDelete={handleEventDelete}
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
        <div className="bg-slate-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">RSVPs</h2>
          <p className="text-slate-400">RSVPs and analytics coming soon...</p>
        </div>
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