'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '../../src/contexts/AuthContext';
import { useEffect, useState } from 'react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isLoginPage = pathname === '/admin/login/';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace('/admin/login/');
    }
  }, [user, loading, router, isLoginPage]);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login/');
  };

  // Skip loading screen and admin layout for login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For other admin pages, show loading state and auth check
  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--blossom-text-dark)]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-50 to-white opacity-70"></div>
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center h-16">
              {/* Empty div for flex spacing */}
              <div className="w-10"></div>
              
              {/* Center Title */}
              <div className="text-xl font-semibold text-[var(--blossom-text-dark)]">
                RSVP <span className="text-[var(--blossom-pink-primary)]">Karlo</span>
              </div>
              
              {/* Profile Button */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="rounded-full hover:bg-gray-100 focus:outline-none p-1"
                >
                  <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-gray-200">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        {user.email}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminLayoutContent>{children}</AdminLayoutContent></AuthProvider>;
} 