'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../../utils/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../../src/contexts/AuthContext';
import Link from 'next/link';
import CreateOrUpdateEventSeriesCard from '@/src/components/EventSeries/CreateOrUpdateEventSeriesCard/CreateOrUpdateEventSeriesCard';
import { EventSeries } from '@/src/models/interfaces';

export default function NewEventSeries() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/admin/login');
    }
  }, [user, router]);

  const handleSubmit = async (eventSeriesData: Partial<EventSeries>) => {
    try {
      if (!eventSeriesData.alias) {
        throw new Error('Alias is required');
      }

      // Perform final alias uniqueness check
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('alias', '==', eventSeriesData.alias)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      if (!aliasSnapshot.empty) {
        setError('This alias is already taken. Please choose another.');
        return;
      }
      
      // Create a new event series document reference with auto-generated ID
      const newEventSeriesRef = doc(collection(db, 'eventSeries'));
      const eventSeriesId = newEventSeriesRef.id;
      
      // Create a batch to perform both operations atomically
      const batch = writeBatch(db);
      
      // Add the event series document
      batch.set(newEventSeriesRef, {
        ...eventSeriesData,
        createdAt: new Date()
      });
      
      // Add the alias document with an auto-generated ID
      const aliasDocRef = doc(collection(db, 'aliases'));
      batch.set(aliasDocRef, {
        alias: eventSeriesData.alias,
        eventSeriesId,
        createdBy: user?.uid,
        createdAt: new Date()
      });
      
      // Commit the batch
      await batch.commit();
      
      // Redirect to the admin dashboard
      router.push('/admin');
    } catch (error) {
      console.error('Error creating event series:', error);
      setError('An error occurred while creating the event series. Please try again.');
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  return (
    <div className="p-8 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Create New Event Series</h1>
          <Link href="/admin" className="text-slate-300 hover:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6 text-red-500">
            {error}
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