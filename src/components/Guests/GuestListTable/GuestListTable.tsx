'use client';

import { Guest, Event } from '@/src/models/interfaces';
import GuestListTableRow from '../GuestListTableRow/GuestListTableRow';
import toast from 'react-hot-toast';
import { useState } from "react";

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

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  alreadySentCount: number;
}

function WarningModal({ isOpen, onClose, onConfirm, alreadySentCount }: WarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true"></div>
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-[var(--blossom-text-dark)]">
                Warning: Emails Already Sent
              </h3>
              <div className="mt-2">
                <p className="text-sm text-[var(--blossom-text-dark)]/70">
                  {alreadySentCount} {alreadySentCount === 1 ? 'guest has' : 'guests have'} already been sent their email invites. 
                  Do you want to send them again?
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-[var(--blossom-pink-primary)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--blossom-pink-hover)] sm:ml-3 sm:w-auto"
              onClick={onConfirm}
            >
              Send Anyway
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[var(--blossom-text-dark)] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [alreadySentCount, setAlreadySentCount] = useState(0);

  const allGuestsSelected = selectedGuests.length === guests.length && guests.length > 0;
  
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
  
  const checkAlreadySentEmails = (guests: Guest[]) => {
    return guests.filter(guest => guest.emailSent).length;
  };

  const handleBulkEmail = async () => {
    const selectedGuestsToEmail = allGuestsSelected ? guests : guests.filter(guest => selectedGuests.includes(guest.id));
    const alreadySent = checkAlreadySentEmails(selectedGuestsToEmail);
    
    if (alreadySent > 0) {
      setAlreadySentCount(alreadySent);
      setShowWarningModal(true);
      return;
    }
    
    await sendBulkEmails();
  };

  const sendBulkEmails = async () => {
    try {
      setIsSendingEmails(true);
      await onBulkEmail();
      toast.success(`Successfully sent emails to ${selectedGuests.length} ${selectedGuests.length === 1 ? 'guest' : 'guests'}.`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error('Error sending emails:', err);
      const errorMessage = err instanceof Error ? err.message : 'There was an error sending the emails. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSendingEmails(false);
      setShowWarningModal(false);
    }
  };

  const handleWarningConfirm = async () => {
    setShowWarningModal(false);
    await sendBulkEmails();
  };

  const handleExport = async () => {
    try {
      // Call the original export function
      await onExportGuests();
      
      // Show success toast
      toast.success(`Successfully exported ${selectedGuests.length} ${selectedGuests.length === 1 ? 'guest' : 'guests'}.`);
    } catch (err) {
      console.error('Error exporting guests:', err);
      toast.error('There was an error exporting the guests. Please try again.');
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[var(--blossom-text-dark)]">Guests</h2>
          <div className="flex space-x-2">
            {selectedGuests.length > 0 ? (
              <button
                onClick={handleExport}
                className="bg-[var(--blossom-pink-light)] hover:bg-pink-200 text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                </svg>
                {allGuestsSelected ? 'Export Guests' : 'Export Selected'}
              </button>
            ) : (
              <button
                onClick={onImportGuests}
                className="bg-[var(--blossom-pink-light)] hover:bg-pink-200 text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                </svg>
                Import Guests
              </button>
            )}
            <button
              onClick={handleBulkEmail}
              disabled={selectedGuests.length === 0 || isSendingEmails}
              className="bg-[var(--blossom-pink-light)] hover:bg-pink-200 text-[var(--blossom-text-dark)] py-1.5 px-3 rounded transition-colors flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {isSendingEmails ? 'Sending...' : 'Send Emails'}
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

      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleWarningConfirm}
        alreadySentCount={alreadySentCount}
      />
    </>
  );
} 