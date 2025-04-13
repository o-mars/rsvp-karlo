'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { db } from '../../../utils/firebase';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';

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

export default function RSVPPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGuestAndEvents();
  }, [token]);

  const fetchGuestAndEvents = async () => {
    try {
      // Get guest by ID
      const guestDoc = await getDoc(doc(db, 'guests', token));
      
      if (!guestDoc.exists()) {
        setError('Invalid RSVP link');
        setLoading(false);
        return;
      }

      const guestData = { id: guestDoc.id, ...guestDoc.data() } as Guest;
      setGuest(guestData);

      // Get all events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const eventsList = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsList);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred while loading your RSVP');
      setLoading(false);
    }
  };

  const handleRSVP = async (guestId: string, eventId: string, response: string, isSubGuest: boolean = false) => {
    if (!guest) return;

    try {
      setSaving(true);
      if (isSubGuest) {
        const updatedSubGuests = guest.subGuests.map(subGuest => {
          if (subGuest.id === guestId) {
            return {
              ...subGuest,
              rsvps: { ...subGuest.rsvps, [eventId]: response }
            };
          }
          return subGuest;
        });
        await updateDoc(doc(db, 'guests', guest.id), { subGuests: updatedSubGuests });
        setGuest({ ...guest, subGuests: updatedSubGuests });
      } else {
        const updatedRsvps = { ...guest.rsvps, [eventId]: response };
        await updateDoc(doc(db, 'guests', guest.id), { rsvps: updatedRsvps });
        setGuest({ ...guest, rsvps: updatedRsvps });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      setError('Failed to update RSVP. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white">Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!guest) return <p className="text-red-500">Guest not found</p>;

  const renderRSVPButtons = (guestId: string, rsvps: Record<string, string>, eventId: string, isSubGuest: boolean = false) => (
    <div className="flex space-x-4">
      <button
        onClick={() => handleRSVP(guestId, eventId, 'yes', isSubGuest)}
        disabled={saving}
        className={`px-4 py-2 rounded ${
          rsvps[eventId] === 'yes'
            ? 'bg-green-600 text-white'
            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
        }`}
      >
        Attending
      </button>
      <button
        onClick={() => handleRSVP(guestId, eventId, 'no', isSubGuest)}
        disabled={saving}
        className={`px-4 py-2 rounded ${
          rsvps[eventId] === 'no'
            ? 'bg-red-600 text-white'
            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
        }`}
      >
        Not Attending
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-white">RSVP</h1>
      
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Hello, {guest.firstName} {guest.lastName}!
        </h2>
        <p className="text-slate-300 mb-6">
          Please let us know if you&apos;ll be attending each event you&apos;re invited to.
        </p>

        <div className="space-y-6">
          {events.map((event) => {
            if (!guest.rsvps[event.id]) return null; // Skip events this guest isn&apos;t invited to
            
            return (
              <div key={event.id} className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">{event.name}</h3>
                <p className="text-slate-300 mb-2">{event.date} at {event.time}</p>
                <p className="text-slate-300 mb-4">{event.location}</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">{guest.firstName} {guest.lastName}</h4>
                    {renderRSVPButtons(guest.id, guest.rsvps, event.id)}
                  </div>

                  {(guest.subGuests || []).map((subGuest) => (
                    <div key={subGuest.id} className="border-t border-slate-600 pt-4">
                      <h4 className="text-white font-medium mb-2">{subGuest.firstName} {subGuest.lastName}</h4>
                      {renderRSVPButtons(subGuest.id, subGuest.rsvps, event.id, true)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Additional Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2">Dietary Restrictions</label>
            <input
              type="text"
              value={guest.dietaryRestrictions || ''}
              onChange={(e) => setGuest({ ...guest, dietaryRestrictions: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white p-2 rounded"
              placeholder="Any dietary restrictions?"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2 text-slate-300">
              <input
                type="checkbox"
                checked={guest.plusOne || false}
                onChange={(e) => setGuest({ ...guest, plusOne: e.target.checked })}
                className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span>I will be bringing a plus one</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
