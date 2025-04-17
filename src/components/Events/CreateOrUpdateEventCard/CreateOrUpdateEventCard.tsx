'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Event } from '@/src/models/interfaces';
import DateInput from '@/src/components/shared/DateInput';
import TimeInput from '@/src/components/shared/TimeInput';

interface CreateOrUpdateEventCardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  editingEvent: Event | null;
  eventSeriesId: string;
  eventSeriesAlias: string;
}

export default function CreateOrUpdateEventCard({
  isOpen,
  onClose,
  onComplete,
  editingEvent,
  eventSeriesId,
  eventSeriesAlias
}: CreateOrUpdateEventCardProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    location: '',
    description: '',
    additionalFields: {},
  });
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  
  // Update form values when editingEvent changes
  useEffect(() => {
    if (editingEvent) {
      // Set event details
      setNewEvent({
        name: editingEvent.name || '',
        location: editingEvent.location || '',
        description: editingEvent.description || '',
        additionalFields: editingEvent.additionalFields || {},
      });
      
      // Set date and time values
      if (editingEvent.startDateTime) {
        const startDate = editingEvent.startDateTime.toDate();
        setDate(startDate.toISOString().split('T')[0]);
        setStartTime(startDate.toISOString().split('T')[1].substring(0, 5));
      }
      
      if (editingEvent.endDateTime) {
        const endDate = editingEvent.endDateTime.toDate();
        setEndTime(endDate.toISOString().split('T')[1].substring(0, 5));
      } else {
        setEndTime('');
      }
    } else {
      resetForm();
    }
  }, [editingEvent]);
  
  const resetForm = () => {
    setNewEvent({
      name: '',
      location: '',
      description: '',
      additionalFields: {},
    });
    setDate('');
    setStartTime('');
    setEndTime('');
    setNewFieldKey('');
    setNewFieldValue('');
  };
  
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = endTime ? new Date(`${date}T${endTime}`) : undefined;
      
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        startDateTime,
        ...(endDateTime && { endDateTime }),
        additionalFields: newEvent.additionalFields || {},
        eventSeriesAlias,
        eventSeriesId,
        createdAt: new Date()
      });
      
      resetForm();
      onClose();
      onComplete();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = endTime ? new Date(`${date}T${endTime}`) : null;
      
      await updateDoc(doc(db, 'events', editingEvent.id), {
        ...newEvent,
        startDateTime,
        endDateTime,
        additionalFields: newEvent.additionalFields || {},
      });
      
      onClose();
      onComplete();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const addCustomField = () => {
    if (!newFieldKey || !newFieldValue) return;
    
    setNewEvent({
      ...newEvent,
      additionalFields: {
        ...newEvent.additionalFields,
        [newFieldKey]: newFieldValue,
      },
    });
    
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const removeCustomField = (key: string) => {
    const fields = { ...newEvent.additionalFields };
    delete fields[key];
    setNewEvent({ ...newEvent, additionalFields: fields });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white" id="modal-title">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="col-span-2">
                  <label htmlFor="event-name" className="block text-sm font-medium text-slate-300 mb-1">
                    Event Name
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    placeholder="Enter event name"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500 w-full"
                    required
                  />
                </div>
                
                <DateInput 
                  id="event-date"
                  label="When"
                  value={date}
                  onChange={setDate}
                  required={true}
                />
                
                <div className="col-span-1">
                  <div className="flex gap-4">
                    <TimeInput
                      id="start-time"
                      label="From"
                      value={startTime}
                      onChange={setStartTime}
                      required={true}
                      className="flex-1"
                    />
                    
                    <TimeInput
                      id="end-time"
                      label="Till (Optional)"
                      value={endTime}
                      onChange={setEndTime}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    placeholder="Enter location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500 w-full"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Enter event description"
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="bg-slate-700 border border-slate-600 text-white p-2 rounded w-full focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-white">Event Details</h3>
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <label htmlFor="detail-name" className="block text-sm font-medium text-slate-300 mb-1">
                      Detail Name
                    </label>
                    <input
                      id="detail-name"
                      type="text"
                      placeholder="e.g., Dress Code, Menu, RSVP By"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                      className="bg-slate-700 border border-slate-600 text-white p-2 rounded w-full focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div className="flex-grow">
                    <label htmlFor="detail-value" className="block text-sm font-medium text-slate-300 mb-1">
                      Detail Value
                    </label>
                    <input
                      id="detail-value"
                      type="text"
                      placeholder="e.g., Formal, Italian, June 1st"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      className="bg-slate-700 border border-slate-600 text-white p-2 rounded w-full focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.entries(newEvent.additionalFields || {}).map(([key, value]) => (
                    <div key={key} className="inline-flex items-center bg-slate-700 px-3 py-1.5 rounded">
                      <div>
                        <span className="font-medium text-white">{key}:</span>
                        <span className="ml-1 text-slate-300">{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomField(key)}
                        className="ml-2 text-red-400 hover:text-red-300 text-lg font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-500"
                >
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 