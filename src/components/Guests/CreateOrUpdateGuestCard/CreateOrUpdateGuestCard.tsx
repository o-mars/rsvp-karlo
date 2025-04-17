'use client';

import { useState, useEffect } from 'react';
import { Guest, Event } from '@/src/models/interfaces';

interface CreateOrUpdateGuestCardProps {
  guest: Partial<Guest> | null;
  events: Event[];
  onSubmit: (guest: Partial<Guest>) => void;
  onCancel: () => void;
}

export default function CreateOrUpdateGuestCard({
  guest,
  events,
  onSubmit,
  onCancel
}: CreateOrUpdateGuestCardProps) {
  const [guestData, setGuestData] = useState<Partial<Guest>>({
    firstName: '',
    lastName: '',
    email: '',
    rsvps: {} as Record<string, string>,
    subGuests: [],
  });

  // Initialize the form with guest data when editing
  useEffect(() => {
    if (guest) {
      setGuestData({
        ...guest,
        // Ensure we have deep copies for nested objects
        rsvps: { ...(guest.rsvps || {}) },
        subGuests: (guest.subGuests || []).map(sg => ({
          ...sg,
          rsvps: { ...sg.rsvps },
        })),
      });
    }
  }, [guest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(guestData);
  };

  return (
    <div className="bg-slate-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">
        {guest ? 'Edit Guest' : 'Add New Guest'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            type="text"
            placeholder="First Name"
            value={guestData.firstName || ''}
            onChange={(e) => setGuestData({ ...guestData, firstName: e.target.value })}
            className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={guestData.lastName || ''}
            onChange={(e) => setGuestData({ ...guestData, lastName: e.target.value })}
            className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={guestData.email || ''}
            onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
            className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-white">Event Invitations</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={guestData.rsvps?.[event.id] !== undefined}
                  onChange={(e) => {
                    const updatedRsvps = { ...(guestData.rsvps || {}) };
                    const updatedSubGuests = (guestData.subGuests || []).map(subGuest => ({
                      ...subGuest,
                      rsvps: { ...subGuest.rsvps }
                    }));
                    
                    if (e.target.checked) {
                      updatedRsvps[event.id] = 'pending';
                      // Set all sub-guests to pending for this event
                      updatedSubGuests.forEach(subGuest => {
                        subGuest.rsvps[event.id] = 'pending';
                      });
                    } else {
                      delete updatedRsvps[event.id];
                      // Remove event from all sub-guests
                      updatedSubGuests.forEach(subGuest => {
                        delete subGuest.rsvps[event.id];
                      });
                    }
                    
                    setGuestData({
                      ...guestData,
                      rsvps: updatedRsvps,
                      subGuests: updatedSubGuests
                    });
                  }}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white">{event.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-white">Additional Guests</h3>
          <div className="space-y-4">
            {(guestData.subGuests || []).map((subGuest, index) => (
              <div key={subGuest.id} className="bg-slate-700 p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-white font-medium">
                    Guest {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestData({
                        ...guestData,
                        subGuests: (guestData.subGuests || []).filter((_, i) => i !== index)
                      });
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={subGuest.firstName}
                    onChange={(e) => {
                      const updatedSubGuests = [...(guestData.subGuests || [])];
                      updatedSubGuests[index] = { ...subGuest, firstName: e.target.value };
                      setGuestData({ ...guestData, subGuests: updatedSubGuests });
                    }}
                    className="bg-slate-600 border border-slate-500 text-white p-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={subGuest.lastName}
                    onChange={(e) => {
                      const updatedSubGuests = [...(guestData.subGuests || [])];
                      updatedSubGuests[index] = { ...subGuest, lastName: e.target.value };
                      setGuestData({ ...guestData, subGuests: updatedSubGuests });
                    }}
                    className="bg-slate-600 border border-slate-500 text-white p-2 rounded"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const newSubGuestData = {
                id: Math.random().toString(36).substring(2, 15),
                firstName: '',
                lastName: '',
                rsvps: events.reduce((acc, event) => {
                  // Only include events the main guest is invited to
                  if (guestData.rsvps?.[event.id]) {
                    return { ...acc, [event.id]: 'pending' };
                  }
                  return acc;
                }, {} as Record<string, string>)
              };
              
              setGuestData({
                ...guestData,
                subGuests: [...(guestData.subGuests || []), newSubGuestData]
              });
            }}
            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
          >
            Add Additional Guest
          </button>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          >
            {guest ? 'Update Guest' : 'Add Guest'}
          </button>
        </div>
      </form>
    </div>
  );
} 