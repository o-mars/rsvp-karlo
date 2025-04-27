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
    return <div className="min-h-screen flex items-center justify-center text-[var(--blossom-text-dark)]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-50 to-white opacity-70"></div>
      <div className="relative z-10 max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminLayoutContent>{children}</AdminLayoutContent></AuthProvider>;
} 