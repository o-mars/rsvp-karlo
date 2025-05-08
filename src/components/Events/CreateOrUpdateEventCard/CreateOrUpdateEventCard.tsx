'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/src/models/interfaces';
import DateInput from '@/src/components/shared/DateInput';
import TimeInput from '@/src/components/shared/TimeInput';
import TimezonePicker from '@/src/components/shared/TimezonePicker';
import Image from 'next/image';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import { toast } from 'react-hot-toast';
import { createDateInTimezone } from '@/src/utils/dateUtils';

interface CreateOrUpdateEventCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Partial<Event>, startDateTime: Date, endDateTime: Date | null) => void;
  editingEvent: Event | null;
  occasionId: string;
  occasionAlias: string;
}

export default function CreateOrUpdateEventCard({
  isOpen,
  onClose,
  onSubmit,
  editingEvent,
  occasionId,
  occasionAlias
}: CreateOrUpdateEventCardProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { uploadEventInvite } = useEventManagement({ occasionId });
  
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    location: '',
    description: '',
    additionalFields: {},
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  
  // Update form values when editingEvent changes
  useEffect(() => {
    if (editingEvent) {
      console.log('editingEvent', editingEvent);

      setNewEvent({
        name: editingEvent.name || '',
        location: editingEvent.location || '',
        description: editingEvent.description || '',
        additionalFields: editingEvent.additionalFields || {},
        inviteImageUrl: editingEvent.inviteImageUrl,
        timezone: editingEvent.timezone
      });
      
      // Set date and time values
      if (editingEvent.startDateTime) {
        const startDate = editingEvent.startDateTime.toDate();
        setDate(startDate.toISOString().split('T')[0]);
        setTime(startDate.toISOString().split('T')[1].substring(0, 5));
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setDate('');
    setTime('');
    setNewFieldKey('');
    setNewFieldValue('');
    setUploadError(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDateTime = createDateInTimezone(date, time, newEvent.timezone || '');
      
      // Include occasionId and occasionAlias for new events
      const eventData = {
        ...newEvent,
        ...(editingEvent ? {} : { 
          occasionId,
          occasionAlias
        })
      };
      
      onSubmit(eventData, startDateTime, null);
      
      if (!editingEvent) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error('Error with event submission:', error);
    }
  };

  const addCustomField = () => {
    if (!newFieldKey) return;
    
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store previous state in case of error
    const previousEventState = { ...newEvent };

    setIsUploading(true);
    setUploadError(null);

    try {
      const downloadUrl = await uploadEventInvite(file, newEvent.name || 'untitled-event');
      
      setNewEvent(prev => ({
        ...prev,
        inviteImageUrl: downloadUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setNewEvent(previousEventState);
      toast.error('Failed to upload image. Please try again.');      
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setNewEvent(prev => ({
      ...prev,
      inviteImageUrl: undefined
    }));
    setUploadError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        aria-hidden="true"
        style={{ zIndex: -1 }}
      ></div>
      
      {/* Modal content */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
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
              
              <div className="col-span-1 sm:col-span-1">
                <DateInput 
                  id="event-date"
                  label="When"
                  value={date}
                  onChange={setDate}
                  required={true}
                  className="w-full"
                />
              </div>
              
              <div className="col-span-1">
                <div className="flex gap-4">
                  <div className="w-32">
                    <TimeInput
                      id="event-time"
                      label="At"
                      value={time}
                      onChange={setTime}
                      required={true}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label htmlFor="timezone" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                      Timezone
                    </label>
                    <TimezonePicker
                      value={newEvent.timezone || ''}
                      onChange={(newTimezone) => {
                        setNewEvent(prev => ({ ...prev, timezone: newTimezone }));
                      }}
                      className="w-full"
                    />
                  </div>
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
                    Detail
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
                    Additional Info (Optional)
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
                    disabled={!newFieldKey}
                    className={`px-4 py-2 rounded ${
                      newFieldKey 
                        ? 'bg-[var(--blossom-pink-primary)] text-white hover:bg-[var(--blossom-pink-hover)]' 
                        : 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)]/50 cursor-not-allowed'
                    }`}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.entries(newEvent.additionalFields || {}).map(([key, value]) => (
                  <div key={key} className="inline-flex items-center bg-[var(--blossom-pink-light)] px-3 py-1.5 rounded">
                    <div>
                      <span className="font-medium text-[var(--blossom-text-dark)]">{key}</span>
                      {value && value !== '' && <span className="ml-1 text-[var(--blossom-text-dark)]/70">: {value}</span>}
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

            <div className="space-y-3">
              <h3 className="font-medium text-[var(--blossom-text-dark)]">Event Invitation</h3>
              <div className="flex flex-col gap-4">
                {newEvent.inviteImageUrl ? (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded overflow-hidden">
                      <Image
                        src={newEvent.inviteImageUrl}
                        alt="Event invitation preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <label className="bg-yellow-500 text-white p-1 rounded-full hover:bg-yellow-600 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </label>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <label className="flex-1">
                      <div className={`bg-white border ${uploadError ? 'border-red-500' : 'border-[var(--blossom-border)]'} rounded p-4 text-center cursor-pointer hover:bg-[var(--blossom-pink-light)] transition-colors`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--blossom-pink-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[var(--blossom-text-dark)]">
                            {isUploading ? 'Uploading...' : 'Upload Invitation Image'}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                )}
                
                {uploadError && (
                  <div className="text-red-500 text-sm">
                    {uploadError}
                  </div>
                )}
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
  );
} 