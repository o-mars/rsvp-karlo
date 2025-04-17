'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '../../src/contexts/AuthContext';
import { useEffect } from 'react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
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
      <div className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminLayoutContent>{children}</AdminLayoutContent></AuthProvider>;
} 