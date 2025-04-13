/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs, setDoc, query, orderBy, doc } from 'firebase/firestore';
import Papa from 'papaparse';

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
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuest, setNewGuest] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '',
    eventType: 'x' as 'x' | 'y'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    const q = query(collection(db, 'guests'), orderBy('lastName'));
    const querySnapshot = await getDocs(q);
    const guestsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Guest[];
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
    <div className="p-8">
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
  );
} 