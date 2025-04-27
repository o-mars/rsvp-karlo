'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Occasion } from '@/src/models/interfaces';
import DeleteConfirmationModal from '@/src/components/shared/DeleteConfirmationModal';

interface OccasionCardProps {
  occasion: Occasion;
  onDelete: (occasionId: string) => void;
}

export default function OccasionCard({
  occasion,
  onDelete,
}: OccasionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(occasion.id);
    } catch (error) {
      console.error('Error deleting occasion:', error);
      alert('Failed to delete occasion. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };
  
  return (
    <>
      <Link 
        href={`/admin/occasions/?a=${occasion.alias}`} 
        key={occasion.id}
        className="bg-white border border-[var(--blossom-border)] rounded-lg p-6 hover:bg-[var(--blossom-pink-light)] transition-colors shadow-[var(--blossom-card-shadow)] group relative"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-[var(--blossom-text-dark)] group-hover:text-[var(--blossom-text-dark)] transition-colors">{occasion.name}</h2>
          <button 
            onClick={handleDeleteClick}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-600 hover:bg-red-500/30 transition-colors z-10"
            aria-label="Delete occasion"
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
        
        {occasion.description && (
          <p className="text-[var(--blossom-text-dark)]/80 text-sm line-clamp-2 group-hover:text-[var(--blossom-text-dark)]/90 transition-colors">
            {occasion.description}
          </p>
        )}

        <div className="mt-4 text-xs text-[var(--blossom-text-dark)]/60">
          Created {new Date(occasion.createdAt?.toDate?.() || occasion.createdAt).toLocaleDateString()}
        </div>
      </Link>
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        itemName={occasion.name}
        itemType="Occasion"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
} 