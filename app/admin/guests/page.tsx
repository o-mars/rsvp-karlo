'use client';

import { useState } from 'react';
import CreateOrUpdateGuest from '@/src/components/Guests/CreateOrUpdateGuest/CreateOrUpdateGuest';
import GuestListTable from '@/src/components/Guests/GuestListTable/GuestListTable';
import { useGuestManagement } from '@/src/hooks/useGuestManagement';
import { Guest } from '@/src/models/interfaces';

export default function GuestsPage() {
  const {
    guests,
    events,
    loading,
    selectedGuests,
    editingGuest,
    setEditingGuest,
    handleAddGuest,
    handleUpdateGuest,
    handleDeleteGuest,
    handleBulkEmail,
    toggleGuestSelection,
    toggleAllSelection,
  } = useGuestManagement();
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  const handleGuestSubmit = (guestData: Partial<Guest>) => {
    if (editingGuest) {
      handleUpdateGuest({ ...guestData, id: editingGuest.id });
    } else {
      handleAddGuest(guestData);
    }
  };

  const handleImport = async () => {
    try {
      const lines = importData.split('\n');
      for (const line of lines) {
        const [firstName, lastName, email] = line.split(',').map(s => s.trim());
        if (firstName && lastName) {
          await handleAddGuest({
            firstName,
            lastName,
            email: email || '',
          });
        }
      }
      setShowImportModal(false);
      setImportData('');
    } catch (error) {
      console.error('Error importing guests:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add or Edit Guest Form */}
      <CreateOrUpdateGuest
        guest={editingGuest}
        events={events}
        onSubmit={handleGuestSubmit}
        onCancel={() => setEditingGuest(null)}
      />

      {/* Guest List Table */}
      <GuestListTable
        guests={guests}
        events={events}
        selectedGuests={selectedGuests}
        isLoading={loading}
        onSelectGuest={(id) => toggleGuestSelection(id)}
        onSelectAll={toggleAllSelection}
        onEditGuest={setEditingGuest}
        onDeleteGuest={handleDeleteGuest}
        onBulkEmail={handleBulkEmail}
        onImportGuests={() => setShowImportModal(true)}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">Import Guests</h3>
            <p className="text-slate-300 mb-4">
              Enter guest information in CSV format (First Name, Last Name, Email):
            </p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full h-32 bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John,Doe,john@example.com&#10;Jane,Smith,jane@example.com"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 