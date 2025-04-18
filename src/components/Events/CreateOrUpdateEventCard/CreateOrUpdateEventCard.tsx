'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/src/models/interfaces';
import DateInput from '@/src/components/shared/DateInput';
import TimeInput from '@/src/components/shared/TimeInput';

interface CreateOrUpdateEventCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Partial<Event>, startDateTime: Date, endDateTime: Date | null) => void;
  editingEvent: Event | null;
  eventSeriesId: string;
  eventSeriesAlias: string;
}

export default function CreateOrUpdateEventCard({
  isOpen,
  onClose,
  onSubmit,
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = endTime ? new Date(`${date}T${endTime}`) : null;
      
      // Include eventSeriesId and eventSeriesAlias for new events
      const eventData = {
        ...newEvent,
        ...(editingEvent ? {} : { 
          eventSeriesId,
          eventSeriesAlias
        })
      };
      
      onSubmit(eventData, startDateTime, endDateTime);
      
      if (!editingEvent) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error('Error with event submission:', error);
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[var(--blossom-text-dark)]" id="modal-title">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                onClick={onClose}
                className="text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="col-span-2">
                  <label htmlFor="event-name" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                    Event Name
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    placeholder="Enter event name"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full"
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
                  <label htmlFor="location" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    placeholder="Enter location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Enter event description"
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded w-full focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)]"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-[var(--blossom-text-dark)]">Event Details</h3>
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <label htmlFor="detail-name" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                      Detail Name
                    </label>
                    <input
                      id="detail-name"
                      type="text"
                      placeholder="e.g., Dress Code, Menu, RSVP By"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                      className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded w-full focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)]"
                    />
                  </div>
                  <div className="flex-grow">
                    <label htmlFor="detail-value" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                      Detail Value
                    </label>
                    <input
                      id="detail-value"
                      type="text"
                      placeholder="e.g., Formal, Italian, June 1st"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded w-full focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="bg-[var(--blossom-pink-primary)] text-white px-4 py-2 rounded hover:bg-[var(--blossom-pink-hover)]"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.entries(newEvent.additionalFields || {}).map(([key, value]) => (
                    <div key={key} className="inline-flex items-center bg-[var(--blossom-pink-light)] px-3 py-1.5 rounded">
                      <div>
                        <span className="font-medium text-[var(--blossom-text-dark)]">{key}:</span>
                        <span className="ml-1 text-[var(--blossom-text-dark)]/70">{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomField(key)}
                        className="ml-2 text-red-500 hover:text-red-600 text-lg font-bold"
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
                  className="bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)] px-4 py-2 rounded hover:bg-[var(--blossom-pink-medium)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--blossom-pink-primary)] text-white px-4 py-2 rounded hover:bg-[var(--blossom-pink-hover)]"
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