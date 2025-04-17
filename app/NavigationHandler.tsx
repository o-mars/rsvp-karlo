'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function NavigationHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only runs in the client
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      
      // If we're on the root route but the URL shows we should be elsewhere
      if (pathname === '/' && currentPath !== '/') {
        console.log(`[NavigationHandler] Detected direct navigation to: ${currentPath}${currentSearch}`);
        
        // Give Next.js a moment to initialize
        setTimeout(() => {
          router.replace(currentPath + currentSearch);
        }, 100);
      } else {
        console.log(`[NavigationHandler] No redirect needed for: ${currentPath}${currentSearch} -- pathname: ${pathname}`);
      }
    }
  }, [pathname, router]);

  return null;
} 