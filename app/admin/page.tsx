/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../utils/firebase';
import { collection, getDocs, setDoc, query, where, doc } from 'firebase/firestore';
import Papa from 'papaparse';
import { useAuth } from '../AuthContext';
import Link from 'next/link';

interface EventSeries {
  id: string;
  name: string;
  alias: string;
  createdBy: string;
  createdAt: any; // Firestore timestamp
  description?: string;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  token: string;
  rsvp?: string;
  submittedAt?: Date;
  createdAt: Date;
  eventType: 'x' | 'y';
}

interface ParseResult {
  data: string[][];
  errors: any[];
  meta: any;
}

export default function AdminDashboard() {
  const [eventSeries, setEventSeries] = useState<EventSeries[]>([]);
  const [eventSeriesLoading, setEventSeriesLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuest, setNewGuest] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '',
    eventType: 'x' as 'x' | 'y'
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchGuests();
    if (user) {
      fetchEventSeries();
    }
  }, [user]);

  const fetchEventSeries = async () => {
    if (!user) return;

    try {
      setEventSeriesLoading(true);
      
      // Get all event series for the current user without sorting
      const q = query(
        collection(db, 'eventSeries'),
        where('createdBy', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const seriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventSeries[];
      
      // Sort client-side by createdAt in descending order
      seriesList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setEventSeries(seriesList);
    } catch (error) {
      console.error('Error fetching event series:', error);
    } finally {
      setEventSeriesLoading(false);
    }
  };

  const handleCreateNew = () => {
    // This would be expanded later to create a new event series
    router.push('/admin/events/new');
  };

  const fetchGuests = async () => {
    const q = query(collection(db, 'guests'));
    const querySnapshot = await getDocs(q);
    const guestsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Guest[];
    
    // Sort client-side by lastName
    guestsList.sort((a, b) => a.lastName.localeCompare(b.lastName));
    
    setGuests(guestsList);
    setLoading(false);
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = generateToken();
    const guestData = {
      firstName: newGuest.firstName.trim(),
      lastName: newGuest.lastName.trim(),
      email: newGuest.email?.trim() || null,
      token,
      createdAt: new Date(),
      rsvp: null,
      submittedAt: null,
      eventType: newGuest.eventType
    };

    try {
      await setDoc(doc(db, 'guests', token), guestData);
      setNewGuest({ firstName: '', lastName: '', email: '', eventType: 'x' });
      fetchGuests();
    } catch (error) {
      console.error('Error adding guest:', error);
      alert('Failed to add guest. Please try again.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: async (results: ParseResult) => {
          const data = results.data.slice(1) as string[][];
          
          for (const row of data) {
            const [firstName, lastName, email, eventType] = row;
            const token = generateToken();
            const guestData = {
              firstName: firstName?.trim(),
              lastName: lastName?.trim(),
              email: email?.trim() || null,
              token,
              createdAt: new Date(),
              rsvp: null,
              submittedAt: null,
              eventType: (eventType?.trim() === 'y' ? 'y' : 'x') as 'x' | 'y'
            };

            try {
              await setDoc(doc(db, 'guests', token), guestData);
            } catch (error) {
              console.error('Error adding guest from CSV:', error);
            }
          }
          fetchGuests();
        },
        header: true
      });
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-8 text-white">
      {/* Event Series Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Event Series</h1>
          <button 
            onClick={handleCreateNew}
            className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Series
          </button>
        </div>

        {eventSeriesLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : eventSeries.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">No Event Series Found</h2>
            <p className="text-slate-400">Create your first event series to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventSeries.map((series) => (
              <Link 
                href={`/admin/events?a=${series.alias}`} 
                key={series.id}
                className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors shadow-lg group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold group-hover:text-pink-300 transition-colors">{series.name}</h2>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-slate-400 group-hover:text-pink-300 transition-colors" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                
                {series.description && (
                  <p className="text-slate-400 text-sm line-clamp-2 group-hover:text-slate-300 transition-colors">
                    {series.description}
                  </p>
                )}

                <div className="mt-4 text-xs text-slate-500">
                  Created {new Date(series.createdAt?.toDate?.() || series.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Existing Guest Management Section */}
      <div className="p-8 bg-white text-black rounded-lg mb-8">
        <h1 className="text-2xl font-bold mb-8">Guest Management</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Guest</h2>
          <form onSubmit={handleAddGuest} className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="First Name"
                value={newGuest.firstName}
                onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newGuest.lastName}
                onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                className="border p-2 rounded"
              />
              <select
                value={newGuest.eventType}
                onChange={(e) => setNewGuest({ ...newGuest, eventType: e.target.value as 'x' | 'y' })}
                className="border p-2 rounded"
              >
                <option value="x">Event X</option>
                <option value="y">Event Y</option>
              </select>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                Add Guest
              </button>
            </div>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Bulk Import</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="border p-2 rounded"
          />
          <p className="text-sm text-gray-500 mt-2">
            CSV format: firstName,lastName,email,eventType (x or y)
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Guest List</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RSVP Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.map((guest) => (
                <tr key={guest.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guest.firstName} {guest.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{guest.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guest.eventType === 'x' ? 'Event X' : 'Event Y'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guest.rsvp ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        guest.rsvp === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {guest.rsvp === 'yes' ? 'Attending' : 'Not Attending'}
                      </span>
                    ) : (
                      <span className="text-gray-500">No response</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`/rsvp?token=${guest.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View Link
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 