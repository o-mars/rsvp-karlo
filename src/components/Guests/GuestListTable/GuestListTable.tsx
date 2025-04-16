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
  onImportGuests
}: GuestListTableProps) {
  
  if (isLoading) {
    return (
      <div className="bg-slate-800 shadow rounded-lg p-6 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (guests.length === 0) {
    return (
      <div className="bg-slate-800 shadow rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-2 text-white">No Guests Found</h2>
        <p className="text-slate-400 mb-4">Create your first guest to get started</p>
        <button
          onClick={onImportGuests}
          className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
        >
          Import Guests
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Guests</h2>
        <div className="space-x-2">
          <button
            onClick={onImportGuests}
            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
          >
            Import Guests
          </button>
          <button
            onClick={onBulkEmail}
            disabled={selectedGuests.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
          >
            Email Selected
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedGuests.length === guests.length && guests.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
              {events.map((event) => (
                <th key={event.id} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {event.name}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
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