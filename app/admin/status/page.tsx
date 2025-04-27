'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Occasion } from '@/src/models/interfaces';
import { OccasionProvider } from '@/src/contexts/OccasionContext';
import OccasionStatusView from '@/src/components/RSVPs/OccasionStatusView/OccasionStatusView';

export default function StatusPage() {
  const [allOccasions, setAllOccasions] = useState<Occasion[]>([]);
  const [selectedOccasionAlias, setSelectedOccasionAlias] = useState<string | undefined>();
  const [isLoadingOccasion, setIsLoadingOccasion] = useState(true);
  
  // Fetch all event series
  useEffect(() => {
    const fetchAllOccasions = async () => {
      try {
        setIsLoadingOccasion(true);
        const occasionQuery = query(collection(db, 'occasions'), orderBy('name'));
        const snapshot = await getDocs(occasionQuery);
        
        const occasionList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Occasion[];
        
        setAllOccasions(occasionList);
        
        // Set default to first series if there is one
        if (occasionList.length > 0 && !selectedOccasionAlias) {
          setSelectedOccasionAlias(occasionList[0].alias);
        }
      } catch (error) {
        console.error('Error fetching occasion:', error);
      } finally {
        setIsLoadingOccasion(false);
      }
    };
    
    fetchAllOccasions();
  }, [selectedOccasionAlias]);

  const handleOccasionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedOccasionAlias(value === "all" ? undefined : value);
  };

  if (isLoadingOccasion) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Series selector */}
      {allOccasions.length > 0 && (
        <div className="bg-slate-800 shadow rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="occasion" className="text-white font-medium">
              Event Series:
            </label>
            <select
              id="occasion"
              value={selectedOccasionAlias || "all"}
              onChange={handleOccasionChange}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">All Occasions</option>
              {allOccasions.map((occasion) => (
                <option key={occasion.id} value={occasion.alias}>
                  {occasion.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <OccasionProvider initialAlias={selectedOccasionAlias || null}>
        <OccasionStatusView />
      </OccasionProvider>
    </div>
  );
} 