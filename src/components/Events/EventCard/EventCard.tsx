'use client';

import { useState } from 'react';
import { Event } from '@/src/models/interfaces';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import DeleteConfirmationModal from '@/src/components/shared/DeleteConfirmationModal';
import ImagePreviewModal from '@/src/components/shared/ImagePreviewModal';
import { formatEventDate, formatEventTime } from '@/src/utils/dateUtils';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
}

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { handleDeleteEvent } = useEventManagement({ useContext: false });
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  const handleCardClick = () => {
    if (onEdit) {
      onEdit(event);
    }
  };
  
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await handleDeleteEvent(event.id);
      if (onDelete) {
        onDelete(event.id);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Format date/time using our helper functions
  const getEventDate = (): string => {
    return formatEventDate(event.date);
  };
  
  const getTimeDisplay = (): string => {
    return formatEventTime(event.time);
  };
  
  // Split location by commas for better display
  const renderLocation = () => {
    if (!event.location) return null;
    
    const locationParts = event.location.split(',').map(part => part.trim());
    
    return (
      <div className="flex items-center gap-2 text-[var(--blossom-text-dark)]/70">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--blossom-pink-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div className="flex flex-col">
          {locationParts.map((part, index) => (
            <span key={index}>{part}{index < locationParts.length - 1 ? ',' : ''}</span>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div 
        className="bg-white border border-[var(--blossom-border)] rounded-lg p-6 shadow-[var(--blossom-card-shadow)] group relative hover:bg-[var(--blossom-pink-light)] transition-colors cursor-pointer flex flex-col h-full max-w-xs"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-[var(--blossom-text-dark)] group-hover:text-[var(--blossom-text-dark)] transition-colors">{event.name}</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleDeleteClick}
              className="h-6 w-6 flex items-center justify-center rounded-full bg-white/0 text-red-500 group-hover:text-red-600 hover:bg-red-500/30 transition-colors z-10"
              aria-label="Delete event"
              disabled={isDeleting}
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
        </div>
        
        <div className="flex flex-col gap-2 mt-2 mb-4">
          <div className="flex items-center text-[var(--blossom-text-dark)]/70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[var(--blossom-pink-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{getEventDate()}</span>
          </div>
          
          <div className="flex items-center text-[var(--blossom-text-dark)]/70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[var(--blossom-pink-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{getTimeDisplay()}</span>
          </div>
          
          {event.location && renderLocation()}
        </div>
        
        <div className="flex flex-col flex-grow">
          {event.description && (
            <div className="text-[var(--blossom-text-dark)]/70 text-sm line-clamp-3 group-hover:text-[var(--blossom-text-dark)]/80 transition-colors mb-4 overflow-y-auto max-h-32 whitespace-pre-line">
              {event.description}
            </div>
          )}
          
          {/* Additional fields if any */}
          {event.additionalFields && Object.keys(event.additionalFields).length > 0 && (
            <div className="mt-auto pt-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(event.additionalFields).map(([key, value]) => (
                  <div key={key} className="text-xs bg-[var(--blossom-pink-light)]/50 px-2 py-1 rounded">
                    <span className="font-medium text-[var(--blossom-text-dark)]/70">{key}</span>
                    {value && value !== '' && <span className="ml-1 text-[var(--blossom-text-dark)]/70">: {value}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {event.inviteImageUrl && (
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
      </div>
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        itemName={event.name}
        itemType="Event"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {event.inviteImageUrl && (
        <ImagePreviewModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          imageUrl={event.inviteImageUrl}
          alt="Event invitation"
        />
      )}
    </>
  );
} 