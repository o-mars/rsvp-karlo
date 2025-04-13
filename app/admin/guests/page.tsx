'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { v4 as uuidv4 } from 'uuid';

interface SubGuest {
  id: string;
  firstName: string;
  lastName: string;
  rsvps: Record<string, string>;
  dietaryRestrictions?: string;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  rsvps: Record<string, string>;
  subGuests: SubGuest[];
  dietaryRestrictions?: string;
  plusOne?: boolean;
}

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [newGuest, setNewGuest] = useState<Partial<Guest>>({
    firstName: '',
    lastName: '',
    email: '',
    rsvps: {} as Record<string, string>,
  });
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsSnapshot, guestsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'events'), orderBy('date'))),
        getDocs(query(collection(db, 'guests'), orderBy('lastName'))),
      ]);

      const eventsList = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      const guestsList = guestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Guest[];

      setEvents(eventsList);
      setGuests(guestsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.email) return;
    
    const id = uuidv4();
    const token = Math.random().toString(36).substring(2, 15);
    
    try {
      await setDoc(doc(db, 'guests', id), {
        id,
        token,
        firstName: newGuest.firstName,
        lastName: newGuest.lastName,
        email: newGuest.email,
        rsvps: {},
        subGuests: []
      });
      
      setNewGuest({
        firstName: '',
        lastName: '',
        email: '',
        rsvps: {},
        subGuests: []
      });
      
      fetchData();
    } catch (error) {
      console.error('Error adding guest:', error);
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    
    try {
      await updateDoc(doc(db, 'guests', editingGuest.id), {
        ...editingGuest,
      });
      setEditingGuest(null);
      fetchData();
    } catch (error) {
      console.error('Error updating guest:', error);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guest?')) return;
    
    try {
      await deleteDoc(doc(db, 'guests', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting guest:', error);
    }
  };

  const handleImport = async () => {
    try {
      const lines = importData.split('\n');
      for (const line of lines) {
        const [firstName, lastName, email] = line.split(',').map(s => s.trim());
        if (firstName && lastName) {
          const token = Math.random().toString(36).substring(2, 15);
          const id = uuidv4();
          await setDoc(doc(db, 'guests', id), {
            firstName,
            lastName,
            email: email || '',
            token,
            id
          });
        }
      }
      setShowImportModal(false);
      setImportData('');
      fetchData();
    } catch (error) {
      console.error('Error importing guests:', error);
    }
  };

  const handleBulkEmail = async () => {
    try {
      if (!process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL) {
        throw new Error('Email service URL is not configured');
      }

      const selectedGuestsData = guests
        .filter(g => selectedGuests.includes(g.id))
        .filter(g => g.email); // Only include guests with email addresses
      
      if (selectedGuestsData.length === 0) {
        alert('No valid email addresses selected');
        return;
      }

      console.log('Sending emails to:', selectedGuestsData.map(g => g.id));
      console.log('Using service URL:', process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL);

      const response = await fetch(process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL + '/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestIds: selectedGuestsData.map(g => g.id)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Email service error:', errorText);
        throw new Error(`Failed to send emails: ${errorText}`);
      }

      alert('Emails have been sent to selected guests');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error in handleBulkEmail:', error);
      alert(`Error sending emails: ${error?.message || 'Unknown error'}`);
    }
  };

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {editingGuest ? 'Edit Guest' : 'Add New Guest'}
        </h2>
        <form onSubmit={editingGuest ? handleUpdateGuest : handleAddGuest} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="First Name"
              value={editingGuest ? editingGuest.firstName : newGuest.firstName}
              onChange={(e) => editingGuest 
                ? setEditingGuest({ ...editingGuest, firstName: e.target.value })
                : setNewGuest({ ...newGuest, firstName: e.target.value })}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={editingGuest ? editingGuest.lastName : newGuest.lastName}
              onChange={(e) => editingGuest 
                ? setEditingGuest({ ...editingGuest, lastName: e.target.value })
                : setNewGuest({ ...newGuest, lastName: e.target.value })}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={editingGuest ? editingGuest.email : newGuest.email}
              onChange={(e) => editingGuest 
                ? setEditingGuest({ ...editingGuest, email: e.target.value })
                : setNewGuest({ ...newGuest, email: e.target.value })}
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
                    checked={editingGuest 
                      ? editingGuest.rsvps[event.id] !== undefined
                      : newGuest.rsvps?.[event.id] !== undefined}
                    onChange={(e) => {
                      if (editingGuest) {
                        const updatedRsvps = { ...editingGuest.rsvps };
                        const updatedSubGuests = editingGuest.subGuests.map(subGuest => ({
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
                        
                        setEditingGuest({
                          ...editingGuest,
                          rsvps: updatedRsvps,
                          subGuests: updatedSubGuests
                        });
                      } else {
                        const updatedRsvps = { ...(newGuest.rsvps || {}) };
                        const updatedSubGuests = (newGuest.subGuests || []).map(subGuest => ({
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
                        
                        setNewGuest({
                          ...newGuest,
                          rsvps: updatedRsvps,
                          subGuests: updatedSubGuests
                        });
                      }
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
              {(editingGuest ? editingGuest.subGuests : newGuest.subGuests || []).map((subGuest, index) => (
                <div key={subGuest.id} className="bg-slate-700 p-4 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-medium">
                      Guest {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingGuest) {
                          setEditingGuest({
                            ...editingGuest,
                            subGuests: editingGuest.subGuests.filter((_, i) => i !== index)
                          });
                        } else {
                          setNewGuest({
                            ...newGuest,
                            subGuests: (newGuest.subGuests || []).filter((_, i) => i !== index)
                          });
                        }
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
                        if (editingGuest) {
                          const updatedSubGuests = [...editingGuest.subGuests];
                          updatedSubGuests[index] = { ...subGuest, firstName: e.target.value };
                          setEditingGuest({ ...editingGuest, subGuests: updatedSubGuests });
                        } else {
                          const updatedSubGuests = [...(newGuest.subGuests || [])];
                          updatedSubGuests[index] = { ...subGuest, firstName: e.target.value };
                          setNewGuest({ ...newGuest, subGuests: updatedSubGuests });
                        }
                      }}
                      className="bg-slate-600 border border-slate-500 text-white p-2 rounded"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={subGuest.lastName}
                      onChange={(e) => {
                        if (editingGuest) {
                          const updatedSubGuests = [...editingGuest.subGuests];
                          updatedSubGuests[index] = { ...subGuest, lastName: e.target.value };
                          setEditingGuest({ ...editingGuest, subGuests: updatedSubGuests });
                        } else {
                          const updatedSubGuests = [...(newGuest.subGuests || [])];
                          updatedSubGuests[index] = { ...subGuest, lastName: e.target.value };
                          setNewGuest({ ...newGuest, subGuests: updatedSubGuests });
                        }
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
                  rsvps: events.reduce((acc, event) => ({
                    ...acc,
                    [event.id]: 'pending'
                  }), {})
                };
                if (editingGuest) {
                  setEditingGuest({
                    ...editingGuest,
                    subGuests: [...editingGuest.subGuests, newSubGuestData]
                  });
                } else {
                  setNewGuest({
                    ...newGuest,
                    subGuests: [...(newGuest.subGuests || []), newSubGuestData]
                  });
                }
              }}
              className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
            >
              Add Additional Guest
            </button>
          </div>

          <div className="flex justify-end space-x-2">
            {editingGuest && (
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
            >
              {editingGuest ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Guests</h2>
          <div className="space-x-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
            >
              Import Guests
            </button>
            <button
              onClick={handleBulkEmail}
              disabled={selectedGuests.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
            >
              Email Selected
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedGuests.length === guests.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGuests(guests.map(g => g.id));
                      } else {
                        setSelectedGuests([]);
                      }
                    }}
                    className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
                {events.map((event) => (
                  <th key={event.id} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    {event.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {guests.map((guest) => (
                <>
                  <tr key={guest.id} className="hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedGuests.includes(guest.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGuests([...selectedGuests, guest.id]);
                          } else {
                            setSelectedGuests(selectedGuests.filter(id => id !== guest.id));
                          }
                        }}
                        className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {guest.firstName} {guest.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{guest.email}</td>
                    {events.map((event) => (
                      <td key={event.id} className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          guest.rsvps[event.id] === 'yes'
                            ? 'bg-green-900 text-green-300'
                            : guest.rsvps[event.id] === 'no'
                            ? 'bg-red-900 text-red-300'
                            : guest.rsvps[event.id] === 'pending'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-slate-900 text-slate-300'
                        }`}>
                          {guest.rsvps[event.id] || 'Not Invited'}
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setEditingGuest(guest)}
                        className="text-blue-400 hover:text-blue-300 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {(guest.subGuests || []).map((subGuest) => (
                    <tr key={subGuest.id} className="hover:bg-slate-700 bg-slate-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(guest.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGuests([...selectedGuests, guest.id]);
                            } else {
                              setSelectedGuests(selectedGuests.filter(id => id !== guest.id));
                            }
                          }}
                          className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white pl-12">
                        {subGuest.firstName} {subGuest.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">-</td>
                      {events.map((event) => (
                        <td key={event.id} className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subGuest.rsvps[event.id] === 'yes'
                              ? 'bg-green-900 text-green-300'
                              : subGuest.rsvps[event.id] === 'no'
                              ? 'bg-red-900 text-red-300'
                              : subGuest.rsvps[event.id] === 'pending'
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-slate-900 text-slate-300'
                          }`}>
                            {subGuest.rsvps[event.id] || 'Not Invited'}
                          </span>
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingGuest(guest);
                            // TODO: Scroll to the sub-guest in the form
                          }}
                          className="text-blue-400 hover:text-blue-300 mr-2"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">Import Guests</h3>
            <p className="text-slate-300 mb-4">
              Enter guest information in CSV format (First Name, Last Name, Email):
            </p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full h-32 bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John,Doe,john@example.com&#10;Jane,Smith,jane@example.com"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 