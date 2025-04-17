'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '../../src/contexts/AuthContext';
import { useEffect } from 'react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  
  const isLoginPage = pathname === '/admin/login/';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace('/admin/login/');
    }
  }, [user, loading, router, isLoginPage]);

  // Skip loading screen and admin layout for login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For other admin pages, show loading state and auth check
  if (loading || !user) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-800 shadow relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-full font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminLayoutContent>{children}</AdminLayoutContent></AuthProvider>;
} 