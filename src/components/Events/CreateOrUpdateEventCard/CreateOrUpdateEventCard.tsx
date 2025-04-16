'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Event } from '@/src/models/interfaces';

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
        endDateTime,
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
            
            <form onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Event Name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              
              <textarea
                placeholder="Description"
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="bg-slate-700 border border-slate-600 text-white p-2 rounded w-full focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                rows={3}
              />

              <div className="space-y-2">
                <h3 className="font-medium text-white">Additional Fields</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Field Name"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  <input
                    type="text"
                    placeholder="Field Value"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    Add Field
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(newEvent.additionalFields || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 bg-slate-700 p-2 rounded">
                      <span className="font-medium text-white">{key}:</span>
                      <span className="text-slate-300">{value}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomField(key)}
                        className="text-red-400 hover:text-red-300"
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