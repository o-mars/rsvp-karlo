'use client';

import { useState } from 'react';
import { Event } from '@/src/models/interfaces';
import { useEventManagement } from '@/src/hooks/useEventManagement';
import { timestampToDate, formatDate } from '@/src/hooks/useRSVPStats';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
}

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { handleDeleteEvent } = useEventManagement({ useContext: false });
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(event);
    }
  };
  
  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  
  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg group relative hover:bg-slate-700 transition-colors">
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
            {isDeleting ? (
              <svg 
                className="animate-spin h-4 w-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
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
            )}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col mt-2 mb-3">
        <div className="flex items-center text-slate-300 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{getEventDate()}</span>
        </div>
        
        <div className="flex items-center text-slate-300 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{getTimeDisplay()}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}
      </div>
      
      {event.description && (
        <p className="text-slate-400 text-sm line-clamp-3 group-hover:text-slate-300 transition-colors">
          {event.description}
        </p>
      )}
      
      {/* Additional fields if any */}
      {event.additionalFields && Object.keys(event.additionalFields).length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2">
          {Object.entries(event.additionalFields).map(([key, value]) => (
            <div key={key} className="text-xs">
              <span className="font-medium text-slate-400">{key}:</span>
              <span className="ml-1 text-slate-300">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 