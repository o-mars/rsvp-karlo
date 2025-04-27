'use client';

import { useState, useEffect, useMemo } from 'react';
import { Guest, Event, RsvpStatus } from '@/src/models/interfaces';

interface CreateOrUpdateGuestCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guest: Partial<Guest>) => void;
  guest: Partial<Guest> | null;
  events: Event[];
}

export default function CreateOrUpdateGuestCard({
  isOpen,
  onClose,
  onSubmit,
  guest,
  events
}: CreateOrUpdateGuestCardProps) {
  const [guestData, setGuestData] = useState<Partial<Guest>>({
    firstName: '',
    lastName: '',
    email: '',
    rsvps: {} as Record<string, string>,
    additionalGuests: {} as Record<string, number>,
    subGuests: [],
  });
  
  // Track validation errors
  const [errors, setErrors] = useState<{
    mainGuest: string[];
    subGuests: Record<string, string[]>;
  }>({
    mainGuest: [],
    subGuests: {}
  });
  
  const [rsvpLink, setRsvpLink] = useState('');
  // Track copy status
  const [copyStatus, setCopyStatus] = useState(false);

  // Initialize the form with guest data when editing
  useEffect(() => {
    if (guest) {
      setGuestData({
        ...guest,
        // Ensure we have deep copies for nested objects
        rsvps: { ...(guest.rsvps || {}) },
        additionalGuests: { ...(guest.additionalGuests || {}) },
        subGuests: (guest.subGuests || []).map(sg => ({
          ...sg,
          rsvps: { ...sg.rsvps },
        })),
      });
      setRsvpLink(`https://rsvpkarlo.com/rsvp/?a=${guest.eventSeriesAlias || ''}&c=${guest.id || ''}`);
    } else {
      resetForm();
    }
  }, [guest]);
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  // Run validation whenever guestData changes
  useEffect(() => {
    validateGuestData();
  }, [guestData]);
  
  // Handle copy status timeout
  useEffect(() => {
    if (copyStatus) {
      const timer = setTimeout(() => {
        setCopyStatus(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const resetForm = () => {
    setGuestData({
      firstName: '',
      lastName: '',
      email: '',
      rsvps: {} as Record<string, string>,
      additionalGuests: {} as Record<string, number>,
      subGuests: [],
    });
    setErrors({
      mainGuest: [],
      subGuests: {}
    });
  };
  
  // Validate all guest data and update errors state
  const validateGuestData = () => {
    const mainGuestErrors: string[] = [];
    const subGuestErrors: Record<string, string[]> = {};
    
    // Validate main guest
    if (!guestData.firstName?.trim()) {
      mainGuestErrors.push('First name is required');
    }
    
    if (!guestData.lastName?.trim()) {
      mainGuestErrors.push('Last name is required');
    }
    
    const mainGuestEvents = Object.keys(guestData.rsvps || {});
    if (mainGuestEvents.length === 0) {
      mainGuestErrors.push('Guest must be invited to at least one event');
    }
    
    // Validate each sub-guest
    (guestData.subGuests || []).forEach((subGuest) => {
      const errors: string[] = [];
      
      if (!subGuest.firstName?.trim()) {
        errors.push('First name is required');
      }
      
      if (!subGuest.lastName?.trim()) {
        errors.push('Last name is required');
      }
      
      const subGuestEvents = Object.keys(subGuest.rsvps || {});
      if (subGuestEvents.length === 0) {
        errors.push('Must be invited to at least one event');
      }
      
      if (errors.length > 0) {
        subGuestErrors[subGuest.id] = errors;
      }
    });
    
    setErrors({
      mainGuest: mainGuestErrors,
      subGuests: subGuestErrors
    });
  };
  
  // Calculate if the form is valid (no errors)
  const isFormValid = useMemo(() => {
    return errors.mainGuest.length === 0 && 
           Object.keys(errors.subGuests).length === 0;
  }, [errors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation check before submission
    validateGuestData();
    
    if (!isFormValid) {
      // Focus the first error field
      const firstErrorField = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      if (firstErrorField) {
        firstErrorField.focus();
      }
      return;
    }
    
    onSubmit(guestData);
    onClose();
  };
  
  const handleAdditionalGuestsChange = (eventId: string, value: string) => {
    const numberValue = value === '' ? 0 : parseInt(value, 10);
    
    if (isNaN(numberValue) || numberValue < 0) return;
    
    // Get current additionalRsvps value for this event
    const currentAdditionalRsvps = guestData.additionalRsvps?.[eventId] ?? 0;
    
    // If the new additionalGuests value is less than current additionalRsvps,
    // we need to update additionalRsvps to match the new limit
    const updatedAdditionalRsvps = { ...(guestData.additionalRsvps || {}) };
    if (numberValue < currentAdditionalRsvps) {
      updatedAdditionalRsvps[eventId] = numberValue;
    }
    
    setGuestData({
      ...guestData,
      additionalGuests: {
        ...(guestData.additionalGuests || {}),
        [eventId]: numberValue
      },
      additionalRsvps: updatedAdditionalRsvps
    });
  };

  const handleEventInvitationChange = (eventId: string, isInvited: boolean) => {
    const updatedRsvps = { ...(guestData.rsvps || {}) };
    const updatedAdditionalGuests = { ...(guestData.additionalGuests || {}) };
    
    if (isInvited) {
      updatedRsvps[eventId] = RsvpStatus.AWAITING_RESPONSE;
      updatedAdditionalGuests[eventId] = 0; // Initialize to 0 when invited
    } else {
      delete updatedRsvps[eventId];
      delete updatedAdditionalGuests[eventId];
    }
    
    setGuestData({
      ...guestData,
      rsvps: updatedRsvps,
      additionalGuests: updatedAdditionalGuests
    });
  };

  const handleAddSubGuest = () => {
    // Only allow adding a sub-guest if the main guest is invited to at least one event
    const mainGuestEvents = Object.keys(guestData.rsvps || {});
    if (mainGuestEvents.length === 0) {
      // Remove alert and rely on validation UI
      // alert("The main guest must be invited to at least one event before adding additional guests.");
      return;
    }
    
    const newSubGuestData = {
      id: Math.random().toString(36).substring(2, 15),
      firstName: '',
      lastName: '',
      rsvps: Object.keys(guestData.rsvps || {}).reduce((acc, eventId) => {
        // Copy all events the main guest is invited to
        return { ...acc, [eventId]: 'pending' };
      }, {} as Record<string, string>)
    };
    
    setGuestData({
      ...guestData,
      subGuests: [...(guestData.subGuests || []), newSubGuestData]
    });
  };

  const handleRemoveSubGuest = (index: number) => {
    setGuestData({
      ...guestData,
      subGuests: (guestData.subGuests || []).filter((_, i) => i !== index)
    });
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
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[var(--blossom-text-dark)]" id="modal-title">
              {guest ? 'Edit Guest' : 'Add New Guest'}
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--blossom-text-dark)]/50 hover:text-[var(--blossom-text-dark)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-slate-300 mb-1">
                  First Name <span className="text-pink-500">*</span>
                </label>
                <input
                  id="first-name"
                  type="text"
                  placeholder="Enter first name"
                  value={guestData.firstName || ''}
                  onChange={(e) => setGuestData({ ...guestData, firstName: e.target.value })}
                  className={`bg-white border text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full ${
                    errors.mainGuest.includes('First name is required') 
                      ? 'border-red-500' 
                      : 'border-[var(--blossom-border)]'
                  }`}
                  aria-invalid={errors.mainGuest.includes('First name is required')}
                  required
                />
                {errors.mainGuest.includes('First name is required') && (
                  <p className="mt-1 text-sm text-red-500">First name is required</p>
                )}
              </div>
              
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-slate-300 mb-1">
                  Last Name <span className="text-pink-500">*</span>
                </label>
                <input
                  id="last-name"
                  type="text"
                  placeholder="Enter last name"
                  value={guestData.lastName || ''}
                  onChange={(e) => setGuestData({ ...guestData, lastName: e.target.value })}
                  className={`bg-white border text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full ${
                    errors.mainGuest.includes('Last name is required') 
                      ? 'border-red-500' 
                      : 'border-[var(--blossom-border)]'
                  }`}
                  aria-invalid={errors.mainGuest.includes('Last name is required')}
                  required
                />
                {errors.mainGuest.includes('Last name is required') && (
                  <p className="mt-1 text-sm text-red-500">Last name is required</p>
                )}
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={guestData.email || ''}
                  onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                  className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full"
                />
              </div>
            </div>

            {/* Display RSVP Link when in edit mode */}
            {guest && guest.id && (
              <div className="sm:col-span-2">
                <label htmlFor="rsvp-link" className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                  RSVP Code
                </label>
                <div className="flex items-center">
                  <div className="relative flex-grow">
                    <input
                      id="rsvp-link"
                      type="text"
                      readOnly
                      value={guest.id}
                      className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] font-mono p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rsvpLink)
                        .then(() => setCopyStatus(true))
                        .catch(err => console.error('Could not copy text: ', err));
                    }}
                    className="bg-[var(--blossom-pink-light)] hover:bg-[var(--blossom-pink-medium)] text-[var(--blossom-text-dark)] ml-2 p-2 rounded border border-[var(--blossom-border)] flex items-center justify-center"
                    title="Copy RSVP link to clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
                {copyStatus && (
                  <p className="text-green-600 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied to clipboard
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between">
                <h3 className="font-medium text-[var(--blossom-text-dark)] text-base border-b border-[var(--blossom-border)] pb-2">
                  Event Invitations <span className="text-[var(--blossom-pink-primary)]">*</span>
                </h3>
                {errors.mainGuest.includes('Guest must be invited to at least one event') && (
                  <p className="text-sm text-red-500">Guest must be invited to at least one event</p>
                )}
              </div>
              
              <div className={`bg-[var(--blossom-card-bg-secondary)] p-4 rounded-lg ${
                errors.mainGuest.includes('Guest must be invited to at least one event') 
                  ? 'border border-red-500' 
                  : ''
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white p-4 rounded-lg border border-[var(--blossom-border)]">
                      <div className="flex items-center mb-3">
                        <input
                          id={`event-${event.id}`}
                          type="checkbox"
                          checked={guestData.rsvps?.[event.id] !== undefined}
                          onChange={(e) => handleEventInvitationChange(event.id, e.target.checked)}
                          className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)] mr-2"
                        />
                        <label htmlFor={`event-${event.id}`} className="text-[var(--blossom-text-dark)] font-medium">
                          {event.name}
                        </label>
                      </div>
                      
                      {guestData.rsvps?.[event.id] && (
                        <div className="mt-3 pt-2 border-t border-[var(--blossom-border)]">
                          <label htmlFor={`additional-guests-${event.id}`} className="block text-xs font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                            Additional Guests Allowed
                          </label>
                          <input
                            id={`additional-guests-${event.id}`}
                            type="number"
                            min="0"
                            value={guestData.additionalGuests?.[event.id] || 0}
                            onChange={(e) => handleAdditionalGuestsChange(event.id, e.target.value)}
                            className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-[var(--blossom-text-dark)] text-base border-b border-[var(--blossom-border)] pb-2">Additional Guests</h3>
                <button
                  type="button"
                  onClick={handleAddSubGuest}
                  className={`text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm ${
                    Object.keys(guestData.rsvps || {}).length === 0
                      ? 'bg-[var(--blossom-pink-light)]/30 text-[var(--blossom-text-dark)]/50 cursor-not-allowed'
                      : 'bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white'
                  }`}
                  disabled={Object.keys(guestData.rsvps || {}).length === 0}
                  title={Object.keys(guestData.rsvps || {}).length === 0 ? 'Add event invitations first' : ''}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Guest
                </button>
              </div>
              
              {(guestData.subGuests || []).length === 0 ? (
                <div className="text-center py-6 text-[var(--blossom-text-dark)]/70 bg-[var(--blossom-card-bg-secondary)] rounded-lg">
                  <p>No additional guests added yet.</p>
                  <p className="text-sm mt-1">Additional guests will attend with the main guest.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(guestData.subGuests || []).map((subGuest, index) => {
                    const subGuestHasErrors = errors.subGuests[subGuest.id] && errors.subGuests[subGuest.id].length > 0;
                    
                    return (
                      <div 
                        key={subGuest.id} 
                        className={`bg-white p-4 rounded-lg space-y-4 border border-[var(--blossom-border)] ${
                          subGuestHasErrors ? 'border-red-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-[var(--blossom-text-dark)] font-medium">
                            Guest {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubGuest(index)}
                            className="text-red-500 hover:text-red-600 flex items-center text-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`sub-guest-${index}-first-name`} className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                              First Name <span className="text-[var(--blossom-pink-primary)]">*</span>
                            </label>
                            <input
                              id={`sub-guest-${index}-first-name`}
                              type="text"
                              placeholder="Enter first name"
                              value={subGuest.firstName || ''}
                              onChange={(e) => {
                                const updatedSubGuests = [...(guestData.subGuests || [])];
                                updatedSubGuests[index] = { ...subGuest, firstName: e.target.value };
                                setGuestData({ ...guestData, subGuests: updatedSubGuests });
                              }}
                              className={`bg-white border text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full ${
                                errors.subGuests[subGuest.id]?.includes('First name is required') 
                                  ? 'border-red-500' 
                                  : 'border-[var(--blossom-border)]'
                              }`}
                              aria-invalid={errors.subGuests[subGuest.id]?.includes('First name is required')}
                              required
                            />
                            {errors.subGuests[subGuest.id]?.includes('First name is required') && (
                              <p className="mt-1 text-sm text-red-500">First name is required</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor={`sub-guest-${index}-last-name`} className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
                              Last Name <span className="text-[var(--blossom-pink-primary)]">*</span>
                            </label>
                            <input
                              id={`sub-guest-${index}-last-name`}
                              type="text"
                              placeholder="Enter last name"
                              value={subGuest.lastName || ''}
                              onChange={(e) => {
                                const updatedSubGuests = [...(guestData.subGuests || [])];
                                updatedSubGuests[index] = { ...subGuest, lastName: e.target.value };
                                setGuestData({ ...guestData, subGuests: updatedSubGuests });
                              }}
                              className={`bg-white border text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full ${
                                errors.subGuests[subGuest.id]?.includes('Last name is required') 
                                  ? 'border-red-500' 
                                  : 'border-[var(--blossom-border)]'
                              }`}
                              aria-invalid={errors.subGuests[subGuest.id]?.includes('Last name is required')}
                              required
                            />
                            {errors.subGuests[subGuest.id]?.includes('Last name is required') && (
                              <p className="mt-1 text-sm text-red-500">Last name is required</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Event selection for sub-guest */}
                        <div className="mt-4 pt-2 border-t border-[var(--blossom-border)]">
                          <div className="flex flex-wrap items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-[var(--blossom-text-dark)]/70">
                              Event Invitations <span className="text-[var(--blossom-pink-primary)]">*</span>
                            </h5>
                          </div>
                          <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${
                            errors.subGuests[subGuest.id]?.includes('Must be invited to at least one event')
                              ? 'border border-red-500 rounded p-2'
                              : ''
                          }`}>
                            {Object.keys(guestData.rsvps || {}).map((eventId) => {
                              const event = events.find(e => e.id === eventId);
                              if (!event) return null;
                              
                              return (
                                <div key={`sub-${index}-event-${eventId}`} className="flex items-center bg-white p-2 rounded border border-[var(--blossom-border)]">
                                  <input
                                    id={`sub-${index}-event-${eventId}`}
                                    type="checkbox"
                                    checked={subGuest.rsvps?.[eventId] !== undefined}
                                    onChange={(e) => {
                                      const updatedSubGuests = [...(guestData.subGuests || [])];
                                      const updatedRsvps = { ...subGuest.rsvps };
                                      
                                      if (e.target.checked) {
                                        updatedRsvps[eventId] = 'pending';
                                      } else {
                                        delete updatedRsvps[eventId];
                                      }
                                      
                                      updatedSubGuests[index] = { 
                                        ...subGuest, 
                                        rsvps: updatedRsvps 
                                      };
                                      
                                      setGuestData({ 
                                        ...guestData, 
                                        subGuests: updatedSubGuests 
                                      });
                                    }}
                                    className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)] mr-2"
                                  />
                                  <label htmlFor={`sub-${index}-event-${eventId}`} className="text-[var(--blossom-text-dark)] text-sm">
                                    {event.name}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          {errors.subGuests[subGuest.id]?.includes('Must be invited to at least one event') && (
                            <p className="mt-1 text-sm text-red-500">This guest must be invited to at least one event</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-[var(--blossom-pink-light)] hover:bg-[var(--blossom-pink-light)]/80 text-[var(--blossom-text-dark)] px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded ${
                  isFormValid 
                    ? 'bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white' 
                    : 'bg-[var(--blossom-pink-light)]/30 text-[var(--blossom-text-dark)] cursor-not-allowed'
                }`}
                disabled={!isFormValid}
              >
                {guest ? 'Update Guest' : 'Add Guest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 