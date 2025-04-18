'use client';

import { Guest, Event } from '@/src/models/interfaces';
import GuestListTableRow from '../GuestListTableRow/GuestListTableRow';

interface GuestListTableProps {
  guests: Guest[];
  events: Event[];
  selectedGuests: string[];
  isLoading?: boolean;
  onSelectGuest: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (id: string) => void;
  onBulkEmail: () => void;
  onImportGuests: () => void;
  onExportGuests: () => void;
  onAddGuest: () => void;
}

export default function GuestListTable({
  guests,
  events,
  selectedGuests,
  isLoading = false,
  onSelectGuest,
  onSelectAll,
  onEditGuest,
  onDeleteGuest,
  onBulkEmail,
  onImportGuests,
  onExportGuests,
  onAddGuest
}: GuestListTableProps) {
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (guests.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--blossom-text-dark)]">Guests</h2>
          <button 
            onClick={onAddGuest}
            className="bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white py-1.5 px-3 rounded transition-colors flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Guest
          </button>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-[var(--blossom-text-dark)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-lg font-medium text-[var(--blossom-text-dark)]">No Guests Found</p>
        <p className="mt-1 mb-4 text-[var(--blossom-text-dark)]/50">Create your first guest to get started</p>
        <button
          onClick={onImportGuests}
          className="bg-[var(--blossom-pink-light)] hover:bg-[var(--blossom-pink-light)]/80 text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
          </svg>
          Import Guests
        </button>
      </div>
    );
  }
  
  const allGuestsSelected = selectedGuests.length === guests.length && guests.length > 0;
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[var(--blossom-text-dark)]">Guests</h2>
        <div className="flex space-x-2">
          {selectedGuests.length > 0 ? (
            <button
              onClick={onExportGuests}
              className="bg-[var(--blossom-pink-light)] hover:bg-[var(--blossom-pink-light)]/80 text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
              </svg>
              {allGuestsSelected ? 'Export Guests' : 'Export Selected'}
            </button>
          ) : (
            <button
              onClick={onImportGuests}
              className="bg-[var(--blossom-pink-light)] hover:bg-[var(--blossom-pink-light)]/80 text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
              </svg>
              Import Guests
            </button>
          )}
          <button
            onClick={onBulkEmail}
            disabled={selectedGuests.length === 0}
            className="bg-[var(--blossom-pink-light)] hover:bg-[var(--blossom-pink-light)]/80 text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Send Emails
          </button>
          <button
            onClick={onAddGuest}
            className="bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white py-1.5 px-3 rounded transition-colors flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Guest
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--blossom-border)]">
          <thead className="bg-[var(--blossom-pink-light)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--blossom-text-dark)] uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={allGuestsSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)]"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--blossom-text-dark)] uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--blossom-text-dark)] uppercase tracking-wider">Email</th>
              {events.map((event) => (
                <th key={event.id} className="px-6 py-3 text-left text-xs font-medium text-[var(--blossom-text-dark)] uppercase tracking-wider">
                  {event.name}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--blossom-text-dark)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[var(--blossom-border)]">
            {guests.map((guest) => (
              <GuestListTableRow
                key={guest.id}
                guest={guest}
                events={events}
                isSelected={selectedGuests.includes(guest.id)}
                onSelect={(id, selected) => onSelectGuest(id, selected)}
                onEdit={onEditGuest}
                onDelete={onDeleteGuest}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 