'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../src/contexts/AuthContext';
import Link from 'next/link';
import CreateOrUpdateEventSeriesCard from '@/src/components/EventSeries/CreateOrUpdateEventSeriesCard/CreateOrUpdateEventSeriesCard';
import { useEventSeriesManagement } from '@/src/hooks/useEventSeriesManagement';
import { EventSeries } from '@/src/models/interfaces';

export default function NewEventSeries() {
  const router = useRouter();
  const { user } = useAuth();
  
  const { 
    handleAddEventSeries,
    error: eventSeriesError
  } = useEventSeriesManagement({ userId: user?.uid || null, useContext: false });

  const handleSubmit = async (eventSeriesData: Partial<EventSeries>) => {
    try {
      await handleAddEventSeries(eventSeriesData);
      router.push('/admin/');
    } catch (error) {
      console.error('Error creating event series:', error);
    }
  };

  const handleCancel = () => {
    router.push('/admin/');
  };

  return (
    <div className="p-8 text-[var(--blossom-text-dark)]">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Create New Occasion</h1>
          <Link href="/admin" className="text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {eventSeriesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{eventSeriesError}</p>
          </div>
        )}
        
        <CreateOrUpdateEventSeriesCard
          onSubmit={handleSubmit}
          onClose={handleCancel}
          isOpen={true}
          editingEventSeries={null}
          userId={user?.uid || ''}
        />
      </div>
    </div>
  );
} 