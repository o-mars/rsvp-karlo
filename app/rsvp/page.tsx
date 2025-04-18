'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '../../utils/firebase';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Guest, Event, RsvpStatus } from '@/src/models/interfaces';


function RSVPContent() {
  const searchParams = useSearchParams();
  const [inputToken, setInputToken] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [additionalGuestsCount, setAdditionalGuestsCount] = useState<Record<string, number>>({});

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
      // Clean the token using URL parsing to properly handle any query parameters
      let cleanToken = submittedToken;
      
      try {
        // Check if the token is actually a URL with query parameters
        if (submittedToken.includes('?')) {
          // Create a URL object or parse as URL search params
          const params = new URLSearchParams(
            submittedToken.includes('://') 
              ? new URL(submittedToken).search
              : submittedToken.split('?')[1]
          );
          // Get the c parameter value
          const paramToken = params.get('c');
          if (paramToken) {
            cleanToken = paramToken;
          }
        }
        
        console.log('[RSVP] Clean token:', cleanToken);
      } catch (err) {
        console.error('[RSVP] Error parsing token URL:', err);
        // Fall back to the submitted token if parsing fails
      }
      
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
        const updatedAdditionalRsvps = { ...guest.additionalRsvps };
        
        // If the guest is now attending, ensure the event exists in additionalRsvps with default 0
        if (response === RsvpStatus.ATTENDING) {
          updatedAdditionalRsvps[eventId] = updatedAdditionalRsvps[eventId] ?? 0;
        } else {
          // If not attending, remove from additionalRsvps
          delete updatedAdditionalRsvps[eventId];
        }
        
        await updateDoc(doc(db, 'guests', guest.id), { 
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps
        });
        setGuest({ 
          ...guest, 
          rsvps: updatedRsvps,
          additionalRsvps: updatedAdditionalRsvps
        });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      setError('Failed to update RSVP. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdditionalGuestsChange = (eventId: string, count: number) => {
    if (!guest) return;
    
    // Ensure the count doesn't exceed the allowed additionalGuests
    const maxAdditionalGuests = guest.additionalGuests?.[eventId] ?? 0;
    const validatedCount = Math.min(count, maxAdditionalGuests);
    
    setAdditionalGuestsCount(prev => ({
      ...prev,
      [eventId]: validatedCount
    }));
    
    // Update the guest's additionalRsvps in Firestore
    const updatedAdditionalRsvps = { ...guest.additionalRsvps, [eventId]: validatedCount };
    updateDoc(doc(db, 'guests', guest.id), { additionalRsvps: updatedAdditionalRsvps })
      .then(() => {
        setGuest({ ...guest, additionalRsvps: updatedAdditionalRsvps });
      })
      .catch(error => {
        console.error('Error updating additional guests:', error);
        setError('Failed to update additional guests. Please try again.');
      });
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

  const renderRSVPButtons = (guestId: string, rsvps: Record<string, string>, eventId: string, isSubGuest: boolean = false) => {
    const maxAdditionalGuests = guest?.additionalGuests?.[eventId] ?? 0;
    const currentAdditionalGuests = additionalGuestsCount[eventId] ?? 0;

    return (
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={() => handleRSVP(guestId, eventId, RsvpStatus.ATTENDING, isSubGuest)}
            disabled={saving}
            className={`px-4 py-2 rounded ${
              rsvps[eventId] === RsvpStatus.ATTENDING
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Attending
          </button>
          <button
            onClick={() => handleRSVP(guestId, eventId, RsvpStatus.NOT_ATTENDING, isSubGuest)}
            disabled={saving}
            className={`px-4 py-2 rounded ${
              rsvps[eventId] === RsvpStatus.NOT_ATTENDING
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Not Attending
          </button>
        </div>
        {maxAdditionalGuests > 0 && rsvps[eventId] === RsvpStatus.ATTENDING && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-[var(--blossom-text-dark)]">How many additional guests will you be bringing?</label>
            <select
              value={currentAdditionalGuests}
              onChange={(e) => handleAdditionalGuestsChange(eventId, parseInt(e.target.value))}
              className="px-2 py-1 border border-[var(--blossom-border)] rounded text-sm text-[var(--blossom-text-dark)] bg-white"
            >
              {[...Array(maxAdditionalGuests + 1)].map((_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

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

                    {(guest.subGuests || [])
                      .filter(subGuest => subGuest.rsvps[event.id] !== undefined)
                      .map((subGuest) => (
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