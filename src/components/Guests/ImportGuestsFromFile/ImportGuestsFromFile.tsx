'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { useGuestManagement } from '@/src/hooks/useGuestManagement';
import { Guest } from '@/src/models/interfaces';
import { useOccasionManagement } from '@/src/hooks/useOccasionManagement';

interface ParseResult {
  data: string[][];
  errors: Array<{code: string; message: string; row?: number}>;
  meta: {
    aborted: boolean;
    delimiter: string;
    linebreak: string;
    truncated: boolean;
  };
}

interface ImportGuestsFromFileProps {
  onImportComplete?: () => void;
}

export default function ImportGuestsFromFile({ onImportComplete }: ImportGuestsFromFileProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: number; failed: number } | null>(null);
  const { occasion } = useOccasionManagement();
  const { handleAddGuest, events } = useGuestManagement({ occasionId: occasion?.id });

  // Create a map of event names to IDs
  const eventNameToId = new Map<string, string>();
  events.forEach(event => {
    eventNameToId.set(event.name.toLowerCase(), event.id);
  });

  const downloadTemplate = () => {
    // Create the header row
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      ...events.map(event => `${event.name}:additionalGuests`),
      'Sub Guest 1 First Name',
      'Sub Guest 1 Last Name',
      'Sub Guest 1 Events',
      'Sub Guest 2 First Name',
      'Sub Guest 2 Last Name',
      'Sub Guest 2 Events',
      'Repeat For All Other Sub Guests'
    ];

    // Create a sample row
    const sampleRow = [
      'John',
      'Doe',
      'john@example.com',
      ...events.map(event => `${event.name}:1`),
      'Jane',
      'Doe',
      events.map(e => e.name).join(','),
      'Jim',
      'Doe',
      events[0]?.name || ''
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${occasion?.alias}_guest_import_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseEventInvitations = (eventStr: string): { eventId: string; additionalGuests: number } | null => {
    const [eventName, additionalGuests] = eventStr.split(':');
    const eventId = eventNameToId.get(eventName.toLowerCase());
    
    if (!eventId) {
      console.error(`Event "${eventName}" not found`);
      return null;
    }

    return {
      eventId,
      additionalGuests: parseInt(additionalGuests) || 0
    };
  };

  const parseSubGuests = (row: string[], startIndex: number): { subGuests: Guest['subGuests']; nextIndex: number } => {
    const subGuests: Guest['subGuests'] = [];
    let currentIndex = startIndex;

    // Process sub-guests in groups of 3 (firstName, lastName, events)
    while (currentIndex + 2 < row.length) {
      const firstName = row[currentIndex];
      const lastName = row[currentIndex + 1];
      const eventsStr = row[currentIndex + 2];

      if (firstName && lastName) {
        const eventNames = eventsStr.split(',').map(name => name.trim());
        const rsvps: Record<string, string> = {};
        
        // Convert event names to IDs
        eventNames.forEach(eventName => {
          const eventId = eventNameToId.get(eventName.toLowerCase());
          if (eventId) {
            rsvps[eventId] = 'Awaiting Response';
          } else {
            console.error(`Event "${eventName}" not found for sub-guest ${firstName} ${lastName}`);
          }
        });

        if (Object.keys(rsvps).length > 0) {
          subGuests.push({
            id: `${firstName}-${lastName}-${Date.now()}`,
            firstName,
            lastName,
            rsvps
          });
        }
      }

      currentIndex += 3;
    }

    return { subGuests, nextIndex: currentIndex };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportStatus(null);
    
    let successCount = 0;
    let failedCount = 0;
    
    Papa.parse(file, {
      complete: async (results: ParseResult) => {
        // Skip the header row and process the data
        const data = results.data.slice(1) as string[][];
        
        console.log('Parsed data:', data);
        
        for (const row of data) {
          console.log('Processing row:', row);
          
          // Convert row object to array if needed and ensure string values
          const rowArray = Array.isArray(row) 
            ? row.map(String) 
            : Object.values(row).map(String);
          
          // If the first value contains a comma, split it
          const firstValue = rowArray[0];
          if (firstValue.includes(',')) {
            const splitValues = firstValue.split(',');
            rowArray[0] = splitValues[0];
            rowArray.splice(1, 0, ...splitValues.slice(1));
          }
          
          const [firstName, lastName, email, ...rest] = rowArray;
          
          if (!firstName?.trim() || !lastName?.trim()) {
            failedCount++;
            continue;
          }

          // Parse event invitations and additional guests
          const rsvps: Record<string, string> = {};
          const additionalGuests: Record<string, number> = {};
          let currentIndex = 0;

          // Process event invitations until we find a column that doesn't contain a ':'
          while (currentIndex < rest.length && rest[currentIndex] && rest[currentIndex].includes(':')) {
            const result = parseEventInvitations(rest[currentIndex]);
            if (result) {
              rsvps[result.eventId] = 'Awaiting Response';
              additionalGuests[result.eventId] = result.additionalGuests;
            }
            currentIndex++;
          }

          // Parse sub-guests starting from where we left off
          const { subGuests } = parseSubGuests(rest, currentIndex);

          // Only proceed if we have at least one valid event invitation
          if (Object.keys(rsvps).length === 0) {
            console.error(`No valid event invitations found for ${firstName} ${lastName}`);
            failedCount++;
            continue;
          }

          const guestData: Partial<Guest> = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email?.trim() || '',
            rsvps,
            additionalGuests,
            subGuests
          };

          try {
            await handleAddGuest(guestData);
            successCount++;
          } catch (error) {
            console.error('Error adding guest from CSV:', error);
            failedCount++;
          }
        }
        
        setImportStatus({ success: successCount, failed: failedCount });
        setIsImporting(false);
        
        if (onImportComplete) {
          onImportComplete();
        }
      },
      header: true,
      dynamicTyping: false, // Keep everything as strings
      skipEmptyLines: true, // Skip empty lines
      transformHeader: (header: string) => header.trim(), // Trim header whitespace
      transform: (value: string) => value.trim(), // Trim cell values
      delimiter: ',', // Explicitly set delimiter
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setImportStatus({ success: 0, failed: 1 });
        setIsImporting(false);
      }
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-[var(--blossom-border)]">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-md font-medium text-[var(--blossom-text-light)]">
            Upload CSV File
          </label>
          <button
            onClick={downloadTemplate}
            className="text-sm text-[var(--blossom-pink-primary)] hover:text-[var(--blossom-pink-hover)] flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Template
          </button>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-[var(--blossom-text-light)]
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-[var(--blossom-pink-primary)] file:text-white
            hover:file:bg-[var(--blossom-pink-hover)]
            file:cursor-pointer file:transition-colors
            border border-[var(--blossom-border)] rounded-md"
          disabled={isImporting}
        />
        <p className="text-xs text-[var(--blossom-text-light)] mt-4">
          Note: Create your events before downloading the template to import guests. <br />
        </p>
      </div>
      
      {isImporting && (
        <div className="flex items-center space-x-2 text-[var(--blossom-text-light)]">
          <svg className="animate-spin h-5 w-5 text-[var(--blossom-pink-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Importing guests...</span>
        </div>
      )}
      
      {importStatus && (
        <div className={`mt-4 p-3 rounded-md ${
          importStatus.failed > 0 
            ? 'bg-amber-900/20 text-amber-200' 
            : 'bg-green-900/20 text-green-200'
        }`}>
          <p>
            {importStatus.success > 0 && `Successfully imported ${importStatus.success} guest${importStatus.success !== 1 ? 's' : ''}.`}
            {importStatus.failed > 0 && ` Failed to import ${importStatus.failed} guest${importStatus.failed !== 1 ? 's' : ''}.`}
          </p>
        </div>
      )}
    </div>
  );
} 