'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Log current path for debugging
    console.log('[Root] Current path:', window.location.pathname);
    
    // If not on root, navigate to current path
    if (window.location.pathname !== '/') {
      router.push(window.location.pathname + window.location.search);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50 flex flex-col">
      {/* Host an Event Series Button with vh scaling */}
      <div className="absolute top-0 right-0 m-[2vh] z-50">
        <button
          onClick={() => router.push('/admin')}
          className="bg-pink-600 hover:bg-pink-700 text-white px-[2vw] py-[1vh] rounded-full shadow-lg font-semibold transition-colors text-[1.8vh]"
        >
          Host an Event Series
        </button>
      </div>
      
      {/* Full-height hero section with image */}
      <div className="flex-grow flex items-center justify-center">
        <div className="relative h-[100vh] w-auto max-w-full">
          {/* Using Next.js Image component with proper layout */}
          <div className="relative h-full w-auto" style={{ minWidth: '100vw' }}>
            <Image
              src="/WeddingGenericInvite.jpg"
              alt="Wedding Invitation"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 80vw"
              style={{ 
                objectFit: 'contain',
                objectPosition: 'center'
              }}
              quality={100}
            />
          </div>
          
          {/* Button positioned at 9% from the top with responsive sizing */}
          <div className="absolute top-[9%] left-0 right-0 flex justify-center z-10">
            <button
              onClick={() => router.push('/rsvp')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-[3vw] py-[1.5vh] rounded-full text-[2.2vh] font-medium transition-colors shadow-xl transform hover:scale-105"
            >
              RSVP Now
            </button>
          </div>
          
          {/* Footer as overlay at the bottom of image */}
          <div className="absolute bottom-[2vh] left-0 right-0 text-center z-10">
            <p className="text-gray-600 text-[1.5vh] bg-opacity-70 py-[0.5vh] px-[1vw] rounded-full inline-block">
              Powered by{' '}
              <span className="font-medium text-pink-500">RSVP Karlo</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
