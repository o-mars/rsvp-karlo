'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '../../utils/firebase';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import Image from 'next/image';

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

interface TimestampLike {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

interface Event {
  id: string;
  name: string;
  date?: string;
  time?: string;
  startDateTime?: TimestampLike | Date | string | number;
  endDateTime?: TimestampLike | Date | string | number;
  location: string;
  description?: string;
}

function RSVPContent() {
  const searchParams = useSearchParams();
  const [inputToken, setInputToken] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('c');
    if (urlToken) {
      handleTokenSubmit(urlToken);
    }
  }, [searchParams]);

  const handleTokenSubmit = async (submittedToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Clean the token (remove any URL parts if pasted)
      const cleanToken = submittedToken.includes('?c=')
        ? submittedToken.split('?c=').pop()?.split('&')[0] || submittedToken
        : submittedToken;
      
      // Check if guest exists
      const guestRef = doc(db, 'guests', cleanToken);
      const guestSnap = await getDoc(guestRef);
      
      if (!guestSnap.exists()) {
        setError('Invalid RSVP code. Please check your invitation and try again.');
        setLoading(false);
        return;
      }

      // Get guest data
      const guestData = { id: guestSnap.id, ...guestSnap.data() } as Guest;
      setGuest(guestData);

      // Get all events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const eventsList = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsList);

    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error checking token:', err);
    } finally {
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

  // Helper to format timestamp or date/time
  const formatEventDateTime = (event: Event): string => {
    if (event.startDateTime) {
      // Handle Firestore timestamp
      try {
        // Check if it's a Firestore timestamp with toDate method
        if (typeof event.startDateTime === 'object' && 'toDate' in event.startDateTime && typeof event.startDateTime.toDate === 'function') {
          return event.startDateTime.toDate().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
        
        // If it's a Date object
        if (event.startDateTime instanceof Date) {
          return event.startDateTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
        
        // If it's a number or string, convert to Date first
        if (typeof event.startDateTime === 'number' || typeof event.startDateTime === 'string') {
          const date = new Date(event.startDateTime);
          return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }
    
    // If we don't have startDateTime or there was an error, use the sample date
    console.warn('using sample date');
    return "Sunday, August 10th, 2025, 7:00 PM";
  };

  // Background image container
  const BackgroundContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="min-h-screen flex flex-col relative">
        {/* Background image */}
        <div className="fixed inset-0 z-0">
          <div className="relative h-full w-full">
            <Image 
              src="/Background1.jpg" 
              alt="Background" 
              fill 
              priority
              style={{ objectFit: 'cover' }}
              quality={100}
            />
          </div>
        </div>
        
        {/* Content positioned over the background */}
        <div className="relative z-10 flex-grow flex flex-col">
          {children}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <BackgroundContainer>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-800 mt-4">Loading...</p>
          </div>
        </div>
      </BackgroundContainer>
    );
  }

  if (!guest) {
    return (
      <BackgroundContainer>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-serif text-center text-gray-900 mb-6">
              RSVP
            </h1>
            
            <p className="text-gray-600 text-center mb-8">
              Please enter your RSVP code from your invitation
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Enter your RSVP code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                onClick={() => handleTokenSubmit(inputToken)}
                disabled={loading || !inputToken}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                  loading || !inputToken
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-pink-500 hover:bg-pink-600'
                }`}
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500 text-center">
              Having trouble? Contact the couple directly
            </p>
          </div>
        </div>
      </BackgroundContainer>
    );
  }

  const renderRSVPButtons = (guestId: string, rsvps: Record<string, string>, eventId: string, isSubGuest: boolean = false) => (
    <div className="flex space-x-4">
      <button
        onClick={() => handleRSVP(guestId, eventId, 'yes', isSubGuest)}
        disabled={saving}
        className={`px-4 py-2 rounded ${
          rsvps[eventId] === 'yes'
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Not Attending
      </button>
    </div>
  );

  return (
    <BackgroundContainer>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">RSVP</h1>
        
        <div className="bg-white rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Hello, {guest.firstName} {guest.lastName}!
          </h2>
          <p className="text-gray-600 mb-6">
            Please let us know if you&apos;ll be attending each event you&apos;re invited to.
          </p>

          <div className="space-y-6">
            {events.map((event) => {
              if (!guest.rsvps[event.id]) return null; // Skip events this guest isn&apos;t invited to
              
              return (
                <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{event.name}</h3>
                  <p className="text-gray-600 mb-2 italic">{formatEventDateTime(event)}</p>
                  <p className="text-gray-600 mb-4">{event.location}</p>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-4 text-sm">{event.description}</p>
                  )}
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-gray-800 font-medium mb-2">{guest.firstName} {guest.lastName}</h4>
                      {renderRSVPButtons(guest.id, guest.rsvps, event.id)}
                    </div>

                    {(guest.subGuests || []).map((subGuest) => (
                      <div key={subGuest.id} className="border-t border-gray-200 pt-4">
                        <h4 className="text-gray-800 font-medium mb-2">{subGuest.firstName} {subGuest.lastName}</h4>
                        {renderRSVPButtons(subGuest.id, subGuest.rsvps, event.id, true)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BackgroundContainer>
  );
}

export default function RSVPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    }>
      <RSVPContent />
    </Suspense>
  );
} 