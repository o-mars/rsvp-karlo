'use client';

import { useState } from 'react';
import { Event, Guest, SubGuest } from '@/src/models/interfaces';
import DeleteConfirmationModal from '@/src/components/shared/DeleteConfirmationModal';

interface GuestListTableRowProps {
  guest: Guest;
  events: Event[];
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (id: string) => void;
}

export default function GuestListTableRow({
  guest,
  events,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: GuestListTableRowProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Formats RSVP status with appropriate styling
  const RsvpStatus = ({ status }: { status: string | undefined }) => {
    if (!status) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-300">
          Not Invited
        </span>
      );
    }
    
    const classMap: Record<string, string> = {
      'yes': 'bg-green-900 text-green-300',
      'no': 'bg-red-900 text-red-300',
      'pending': 'bg-yellow-900 text-yellow-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classMap[status] || 'bg-slate-900 text-slate-300'}`}>
        {status}
      </span>
    );
  };
  
  const handleRowClick = () => {
    onEdit(guest);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(guest.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };
  
  // Generate rows for sub-guests
  const renderSubGuests = () => {
    if (!guest.subGuests || guest.subGuests.length === 0) return null;
    
    return guest.subGuests.map((subGuest: SubGuest) => (
      <tr 
        key={subGuest.id} 
        className="hover:bg-slate-700 bg-slate-750 cursor-pointer" 
        onClick={handleRowClick}
      >
        <td className="px-6 py-4 whitespace-nowrap" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(guest.id, e.target.checked)}
            className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-white pl-12">
          {subGuest.firstName} {subGuest.lastName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-white">-</td>
        {events.map((event) => (
          <td key={event.id} className="px-6 py-4 whitespace-nowrap">
            <RsvpStatus status={subGuest.rsvps[event.id]} />
          </td>
        ))}
        <td className="px-6 py-4 whitespace-nowrap">
          {/* No actions for sub-guests */}
        </td>
      </tr>
    ));
  };
  
  return (
    <>
      {/* Main guest row */}
      <tr className="hover:bg-slate-700 cursor-pointer" onClick={handleRowClick}>
        <td className="px-6 py-4 whitespace-nowrap" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(guest.id, e.target.checked)}
            className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-white">
          {guest.firstName} {guest.lastName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-white">{guest.email}</td>
        {events.map((event) => (
          <td key={event.id} className="px-6 py-4 whitespace-nowrap">
            <RsvpStatus status={guest.rsvps[event.id]} />
          </td>
        ))}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(guest);
              }}
              className="text-slate-400 hover:text-blue-400"
              aria-label="Edit guest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828l-11.414 11.414-4.242 1.414 1.414-4.242 11.414-11.414z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-slate-400 hover:text-red-400"
              aria-label="Delete guest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      
      {/* Sub-guest rows */}
      {renderSubGuests()}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        itemName={`${guest.firstName} ${guest.lastName}`}
        itemType="Guest"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
} 