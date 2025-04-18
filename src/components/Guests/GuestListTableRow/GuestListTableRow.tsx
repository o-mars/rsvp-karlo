'use client';

import { useState } from 'react';
import { Event, Guest, SubGuest } from '@/src/models/interfaces';
import DeleteConfirmationModal from '@/src/components/shared/DeleteConfirmationModal';
import RsvpStatusBadge from '@/src/components/shared/RsvpStatusBadge';

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
        className="hover:bg-[var(--blossom-pink-light)]/40 bg-white cursor-pointer transition-colors duration-150" 
        onClick={handleRowClick}
      >
        <td className="px-6 py-4 whitespace-nowrap" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(guest.id, e.target.checked)}
            className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)]"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-[var(--blossom-text-dark)] pl-12">
          {subGuest.firstName} {subGuest.lastName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-[var(--blossom-text-dark)]">-</td>
        {events.map((event) => (
          <td key={event.id} className="px-6 py-4 whitespace-nowrap">
            <RsvpStatusBadge status={subGuest.rsvps[event.id]} />
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
      <tr className="hover:bg-[var(--blossom-pink-light)]/40 cursor-pointer transition-colors duration-150" onClick={handleRowClick}>
        <td className="px-6 py-4 whitespace-nowrap" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(guest.id, e.target.checked)}
            className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)]"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-[var(--blossom-text-dark)]">
          {guest.firstName} {guest.lastName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <span 
              className={`mr-1 w-2 h-2 rounded-full ${
                guest.emailSent ? 'bg-green-500' : 'bg-yellow-500'
              }`} 
              title={guest.emailSent ? "Email sent" : "Email not sent"}
            ></span>
            <span className="text-[var(--blossom-text-dark)]">
              {guest.email}
            </span>
          </div>
        </td>
        {events.map((event) => (
          <td key={event.id} className="px-6 py-4 whitespace-nowrap">
            <RsvpStatusBadge status={guest.rsvps[event.id]} />
          </td>
        ))}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(guest);
              }}
              className="text-[var(--blossom-text-dark)]/50 hover:text-[var(--blossom-pink-primary)]"
              aria-label="Edit guest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828l-11.414 11.414-4.242 1.414 1.414-4.242 11.414-11.414z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-[var(--blossom-text-dark)]/50 hover:text-red-500"
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