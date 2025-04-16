'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

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
          {/* Use direct img tag for simplicity and reliability */}
          <img
            src="/WeddingGenericInvite.jpg"
            alt="Wedding Invitation"
            className="h-full w-auto max-w-full object-contain"
          />
          
          {/* Button positioned at 8% from the top with responsive sizing */}
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
