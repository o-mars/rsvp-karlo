'use client';

import { useState, Suspense } from 'react';
import { RsvpCode } from '@/src/components/rsvp/RsvpCode';
import { RsvpContent } from '@/src/components/rsvp/RsvpContent';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/src/contexts/AuthContext';

function RSVPContent() {
  const router = useRouter();
  const [guestId, setGuestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCodeSubmit = (code: string) => {
    setGuestId(code);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setGuestId(null);
  };

  // Background image container
  const BackgroundContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="min-h-screen flex flex-col relative bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-50 to-white opacity-70"></div>
        <div className="relative z-10 flex-grow flex flex-col">
          <header className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">
            <h1 
              className="text-3xl sm:text-5xl font-bold text-gray-900 cursor-pointer transition-colors duration-200 inline-block" 
              onClick={() => router.push('/')}
            >
              RSVP <span className="text-pink-600">Karlo</span>
            </h1>
          </header>
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </div>
    );
  };

  return (
    <BackgroundContainer>
      {guestId ? (
        <AuthProvider>
          <RsvpContent guestId={guestId} onError={handleError} />
        </AuthProvider>
      ) : (
        <RsvpCode onCodeSubmit={handleCodeSubmit} initialError={error} />
      )}
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