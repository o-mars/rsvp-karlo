'use client';

import { useEventSeries } from '../../../src/contexts/EventSeriesContext';

export default function GuestsTab() {
  const { guests } = useEventSeries();

  return (
    <div className="bg-slate-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Guests</h2>
      
      {guests.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-lg font-medium">No guests yet</p>
          <p className="mt-1">Add guests to invite them to your events</p>
          <button 
            className="mt-4 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Guests
          </button>
        </div>
      ) : (
        <p className="text-slate-400">Guest management functionality coming soon...</p>
      )}
    </div>
  );
} 