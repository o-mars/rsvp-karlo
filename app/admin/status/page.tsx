'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { EventSeries } from '@/src/models/interfaces';
import { EventSeriesProvider } from '@/src/contexts/EventSeriesContext';
import EventSeriesStatusView from '@/src/components/RSVPs/EventSeriesStatusView/EventSeriesStatusView';

export default function StatusPage() {
  const [allSeries, setAllSeries] = useState<EventSeries[]>([]);
  const [selectedSeriesAlias, setSelectedSeriesAlias] = useState<string | undefined>();
  const [isLoadingSeries, setIsLoadingSeries] = useState(true);
  
  // Fetch all event series
  useEffect(() => {
    const fetchAllSeries = async () => {
      try {
        setIsLoadingSeries(true);
        const seriesQuery = query(collection(db, 'eventSeries'), orderBy('name'));
        const snapshot = await getDocs(seriesQuery);
        
        const seriesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EventSeries[];
        
        setAllSeries(seriesList);
        
        // Set default to first series if there is one
        if (seriesList.length > 0 && !selectedSeriesAlias) {
          setSelectedSeriesAlias(seriesList[0].alias);
        }
      } catch (error) {
        console.error('Error fetching event series:', error);
      } finally {
        setIsLoadingSeries(false);
      }
    };
    
    fetchAllSeries();
  }, [selectedSeriesAlias]);

  const handleSeriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSeriesAlias(value === "all" ? undefined : value);
  };

  if (isLoadingSeries) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Series selector */}
      {allSeries.length > 0 && (
        <div className="bg-slate-800 shadow rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="eventSeries" className="text-white font-medium">
              Event Series:
            </label>
            <select
              id="eventSeries"
              value={selectedSeriesAlias || "all"}
              onChange={handleSeriesChange}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">All Event Series</option>
              {allSeries.map((series) => (
                <option key={series.id} value={series.alias}>
                  {series.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Wrap the child component with the EventSeriesProvider */}
      <EventSeriesProvider initialAlias={selectedSeriesAlias || null}>
        <EventSeriesStatusView />
      </EventSeriesProvider>
    </div>
  );
} 