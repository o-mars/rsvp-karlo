/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/contexts/AuthContext';
import EventSeriesCard from '@/src/components/EventSeries/EventSeriesCard/EventSeriesCard';
import { useEventSeriesManagement } from '@/src/hooks/useEventSeriesManagement';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const { 
    eventSeriesList: eventSeries, 
    loading: eventSeriesLoading,
    error: eventSeriesError,
    handleDeleteEventSeries
  } = useEventSeriesManagement({ userId: user?.uid || null, useContext: false });

  const handleCreateNew = () => {
    router.push('/admin/events/new/');
  };

  return (
    <div className="p-8 text-[var(--blossom-text-dark)]">
      {/* Event Series Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Occasions</h1>
          <button 
            onClick={handleCreateNew}
            className="bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Occasion
          </button>
        </div>

        {eventSeriesLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--blossom-pink-primary)]"></div>
          </div>
        ) : eventSeriesError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{eventSeriesError}</p>
          </div>
        ) : eventSeries.length === 0 ? (
          <div className="bg-white border border-[var(--blossom-border)] rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">No Occasions Found</h2>
            <p className="text-[var(--blossom-text-dark)]/70">Create your first occasion to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventSeries.map((series) => (
              <EventSeriesCard 
                key={series.id} 
                series={series} 
                onDelete={handleDeleteEventSeries}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 