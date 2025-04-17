'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EventSeries } from '@/src/models/interfaces';
import { db } from '@/utils/firebase';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import DeleteConfirmationModal from '@/src/components/shared/DeleteConfirmationModal';

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
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        itemName={series.name}
        itemType="Occasion"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
