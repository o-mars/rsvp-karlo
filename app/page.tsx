'use client';

import Hero from '@/src/components/splash/Hero';
import Features from '@/src/components/splash/Features';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
    </div>
  );
}
