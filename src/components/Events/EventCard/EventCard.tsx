'use client';

import { useState } from 'react';
import { Event } from '@/src/models/interfaces';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import { timestampToDate, formatDate } from '@/src/hooks/useRSVPStats';
import DeleteConfirmationModal from '@/src/components/shared/DeleteConfirmationModal';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
}

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { handleDeleteEvent } = useEventManagement({ useContext: false });
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(event);
    }
  };
  
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
    return formatDate(timestampToDate(event.startDateTime), 'long');
  };
  
  const getTimeDisplay = (): string => {
    const startDate = timestampToDate(event.startDateTime);
    if (!startDate) return 'Invalid time';
    
    const startTime = formatDate(startDate, 'time');
    
    if (!event.endDateTime) return startTime;
    
    const endDate = timestampToDate(event.endDateTime);
    if (!endDate) return startTime;
    
    return `${startTime} - ${formatDate(endDate, 'time')}`;
  };
  
  // Split location by commas for better display
  const renderLocation = () => {
    if (!event.location) return null;
    
    const locationParts = event.location.split(',').map(part => part.trim());
    
    return (
      <div className="flex text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-pink-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        className="bg-slate-800 rounded-lg p-6 shadow-lg group relative hover:bg-slate-700 transition-colors cursor-pointer flex flex-col h-full max-w-xs"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold group-hover:text-pink-300 transition-colors">{event.name}</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleEditClick}
              className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-500/0 group-hover:bg-blue-500/20 text-slate-400 group-hover:text-blue-500 hover:bg-blue-500/30 transition-colors z-10"
              aria-label="Edit event"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={handleDeleteClick}
              className="h-6 w-6 flex items-center justify-center rounded-full bg-red-500/0 group-hover:bg-red-500/20 text-slate-400 group-hover:text-red-500 hover:bg-red-500/30 transition-colors z-10"
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
          <div className="flex items-center text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-pink-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{getEventDate()}</span>
          </div>
          
          <div className="flex items-center text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-pink-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{getTimeDisplay()}</span>
          </div>
          
          {event.location && renderLocation()}
        </div>
        
        {event.description && (
          <div className="text-slate-400 text-sm line-clamp-3 group-hover:text-slate-300 transition-colors mb-auto overflow-y-auto max-h-32 whitespace-pre-line">
            {event.description}
          </div>
        )}
        
        {/* Additional fields if any */}
        {event.additionalFields && Object.keys(event.additionalFields).length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700">
            <div className="flex flex-wrap gap-2">
              {Object.entries(event.additionalFields).map(([key, value]) => (
                <div key={key} className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                  <span className="font-medium text-slate-400">{key}:</span>
                  <span className="ml-1 text-slate-300">{value}</span>
                </div>
              ))}
            </div>
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
    </>
  );
} 