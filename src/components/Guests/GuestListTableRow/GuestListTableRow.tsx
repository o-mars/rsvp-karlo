'use client';

import { Event, Guest, SubGuest } from '@/src/models/interfaces';

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
  
  // Generate rows for sub-guests
  const renderSubGuests = () => {
    if (!guest.subGuests || guest.subGuests.length === 0) return null;
    
    return guest.subGuests.map((subGuest: SubGuest) => (
      <tr key={subGuest.id} className="hover:bg-slate-700 bg-slate-750">
        <td className="px-6 py-4 whitespace-nowrap">
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
          <button
            onClick={() => onEdit(guest)}
            className="text-blue-400 hover:text-blue-300 mr-2"
          >
            Edit
          </button>
        </td>
      </tr>
    ));
  };
  
  return (
    <>
      {/* Main guest row */}
      <tr className="hover:bg-slate-700">
        <td className="px-6 py-4 whitespace-nowrap">
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
          <button
            onClick={() => onEdit(guest)}
            className="text-blue-400 hover:text-blue-300 mr-2"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(guest.id)}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </td>
      </tr>
      
      {/* Sub-guest rows */}
      {renderSubGuests()}
    </>
  );
} 