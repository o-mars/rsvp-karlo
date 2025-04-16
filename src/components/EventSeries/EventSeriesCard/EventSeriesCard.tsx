'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EventSeries } from '@/src/models/interfaces';
import { db } from '@/utils/firebase';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface EventSeriesCardProps {
  series: EventSeries;
  onDelete?: () => void;
}

export default function EventSeriesCard({ series, onDelete }: EventSeriesCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      // Find the alias document
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('eventSeriesId', '==', series.id)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      // Delete the alias document
      if (!aliasSnapshot.empty) {
        await deleteDoc(doc(db, 'aliases', aliasSnapshot.docs[0].id));
      }
      
      // Delete all events associated with the event series
      const eventsQuery = query(
        collection(db, 'events'),
        where('eventSeriesId', '==', series.id)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      eventsSnapshot.forEach(eventDoc => {
        deleteDoc(doc(db, 'events', eventDoc.id));
      });

      // Delete all guests associated with the event series
      const guestsQuery = query(
        collection(db, 'guests'),
        where('eventSeriesId', '==', series.id)
      );
      const guestsSnapshot = await getDocs(guestsQuery);
      guestsSnapshot.forEach(guestDoc => {  
        deleteDoc(doc(db, 'guests', guestDoc.id));
      });
      
      // Delete the event series document
      await deleteDoc(doc(db, 'eventSeries', series.id));
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting event series:', error);
      alert('Failed to delete event series. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };
  
  return (
    <>
      <Link 
        href={`/admin/events?a=${series.alias}`} 
        key={series.id}
        className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors shadow-lg group relative"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold group-hover:text-pink-300 transition-colors">{series.name}</h2>
          <button 
            onClick={handleDeleteClick}
            className="h-6 w-6 flex items-center justify-center rounded-full bg-red-500/0 group-hover:bg-red-500/20 text-slate-400 group-hover:text-red-500 hover:bg-red-500/30 transition-colors z-10"
            aria-label="Delete event series"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none"
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {series.description && (
          <p className="text-slate-400 text-sm line-clamp-2 group-hover:text-slate-300 transition-colors">
            {series.description}
          </p>
        )}

        <div className="mt-4 text-xs text-slate-500">
          Created {new Date(series.createdAt?.toDate?.() || series.createdAt).toLocaleDateString()}
        </div>
      </Link>
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                      Delete Event Series
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-300">
                        Are you sure you want to delete <span className="font-bold">{series.name}</span>? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm
                    ${isDeleting ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : 'Delete'}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-500 shadow-sm px-4 py-2 bg-slate-600 text-base font-medium text-slate-200 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
