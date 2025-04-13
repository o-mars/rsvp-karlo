'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../utils/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  rsvps: Record<string, string>; // eventId -> rsvp status
  submittedAt?: Date;
  createdAt: Date;
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

interface EventStats {
  totalGuests: number;
  invited: number;
  responded: number;
  attending: number;
  notAttending: number;
  pending: number;
  notInvited: number;
}

export default function StatusPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getEventStats = (eventId: string): EventStats => {
    const eventGuests = guests.filter(g => g.rsvps[eventId] !== undefined);
    const totalGuests = guests.length;
    const invited = eventGuests.length;
    const responded = eventGuests.filter(g => g.rsvps[eventId] === 'yes' || g.rsvps[eventId] === 'no').length;
    const attending = eventGuests.filter(g => g.rsvps[eventId] === 'yes').length;
    const notAttending = eventGuests.filter(g => g.rsvps[eventId] === 'no').length;
    const pending = eventGuests.filter(g => g.rsvps[eventId] === 'pending').length;
    const notInvited = totalGuests - invited;

    return {
      totalGuests,
      invited,
      responded,
      attending,
      notAttending,
      pending,
      notInvited
    };
  };

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Event Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const stats = getEventStats(event.id);
            return (
              <div key={event.id} className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">{event.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Guests:</span>
                    <span className="font-medium">{stats.totalGuests}</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>Invited:</span>
                    <span className="font-medium">{stats.invited}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>Attending:</span>
                    <span className="font-medium">{stats.attending}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Not Attending:</span>
                    <span className="font-medium">{stats.notAttending}</span>
                  </div>
                  <div className="flex justify-between text-yellow-400">
                    <span>Pending Response:</span>
                    <span className="font-medium">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Not Invited:</span>
                    <span className="font-medium">{stats.notInvited}</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>Response Rate:</span>
                    <span className="font-medium">
                      {stats.invited > 0
                        ? `${Math.round((stats.responded / stats.invited) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Guest List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                {events.map((event) => (
                  <th key={event.id} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    {event.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {guest.firstName} {guest.lastName}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 