'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Occasion } from '@/src/models/interfaces';
import DeleteConfirmationModal from '@/src/components/shared/DeleteConfirmationModal';
import Image from 'next/image';

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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

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
        className="bg-white border border-[var(--blossom-border)] rounded-lg p-6 hover:bg-[var(--blossom-pink-light)] transition-colors shadow-[var(--blossom-card-shadow)] group relative flex flex-col h-full"
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
        
        <div className="flex flex-col flex-grow">
          {occasion.description && (
            <p className="text-[var(--blossom-text-dark)]/80 text-sm line-clamp-2 group-hover:text-[var(--blossom-text-dark)]/90 transition-colors mb-4">
              {occasion.description}
            </p>
          )}

          <div className="mt-auto text-xs text-[var(--blossom-text-dark)]/60">
            Created {new Date(occasion.createdAt?.toDate?.() || occasion.createdAt).toLocaleDateString()}
          </div>
        </div>

        {occasion.inviteImageUrl && (
          <div className="flex justify-center mt-4 pt-3 border-t border-[var(--blossom-border)]">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsInviteModalOpen(true);
              }}
              className="text-[var(--blossom-pink-primary)] hover:text-[var(--blossom-pink-hover)] flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Invitation
            </button>
          </div>
        )}
      </Link>
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        itemName={occasion.name}
        itemType="Occasion"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Invitation Preview Modal */}
      {isInviteModalOpen && occasion.inviteImageUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true"></div>
          
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-lg bg-white p-4 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--blossom-text-dark)]">
                  Occasion Invitation
                </h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="relative w-full aspect-[3/4] rounded overflow-hidden">
                <Image
                  src={occasion.inviteImageUrl}
                  alt="Occasion invitation"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 