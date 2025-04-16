/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../src/contexts/AuthContext';
import EventSeriesCard from '@/src/components/EventSeries/EventSeriesCard/EventSeriesCard';
import { EventSeries } from '@/src/models/interfaces';


export default function AdminDashboard() {
  const [eventSeries, setEventSeries] = useState<EventSeries[]>([]);
  const [eventSeriesLoading, setEventSeriesLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchEventSeries();
    }
  }, [user]);

  const fetchEventSeries = async () => {
    if (!user) return;

    try {
      setEventSeriesLoading(true);
      
      // Get all event series for the current user without sorting
      const q = query(
        collection(db, 'eventSeries'),
        where('createdBy', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const seriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventSeries[];
      
      // Sort client-side by createdAt in descending order
      seriesList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt.toDate();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt.toDate();
        return dateB.getTime() - dateA.getTime();
      });
      
      setEventSeries(seriesList);
    } catch (error) {
      console.error('Error fetching event series:', error);
    } finally {
      setEventSeriesLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/admin/events/new');
  };

  return (
    <div className="p-8 text-white">
      {/* Event Series Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Event Series</h1>
          <button 
            onClick={handleCreateNew}
            className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Series
          </button>
        </div>

        {eventSeriesLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : eventSeries.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">No Event Series Found</h2>
            <p className="text-slate-400">Create your first event series to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventSeries.map((series) => (
              <EventSeriesCard 
                key={series.id} 
                series={series} 
                onDelete={fetchEventSeries}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 