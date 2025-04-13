'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
      router.push('/admin');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-serif text-gray-900 mb-4">
            Omar & Zainab
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8">
            We&apos;re getting married!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/admin/login')}
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full text-lg font-medium transition-colors"
            >
              Admin Login
            </button>
            <button
              onClick={() => router.push('/rsvp')}
              className="bg-white hover:bg-gray-100 text-pink-500 border-2 border-pink-500 px-8 py-3 rounded-full text-lg font-medium transition-colors"
            >
              RSVP Here
            </button>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-serif text-gray-900 mb-4">When</h2>
              <p className="text-gray-600">August, 2025</p>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-serif text-gray-900 mb-4">Where</h2>
              <p className="text-gray-600">Mississauga, ON</p>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-serif text-gray-900 mb-4">Dress Code</h2>
              <p className="text-gray-600">Desi/Western Formal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-pink-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            Powered by{' '}
            <span className="font-medium text-pink-500">RSVP Karlo</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
