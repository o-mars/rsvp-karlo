'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import Papa from 'papaparse';

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
  eventSeriesId?: string;
}

export default function ImportGuestsFromFile({ onImportComplete, eventSeriesId }: ImportGuestsFromFileProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: number; failed: number } | null>(null);

  const generateToken = () => {
    // Generate a 20-character random token for better security
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const randomValues = new Uint8Array(20);
    crypto.getRandomValues(randomValues);
    
    randomValues.forEach(value => {
      token += chars[value % chars.length];
    });
    
    return token;
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
        const data = results.data.slice(1) as string[][];
        
        for (const row of data) {
          const [firstName, lastName, email, eventType] = row;
          
          if (!firstName?.trim() || !lastName?.trim()) {
            failedCount++;
            continue;
          }
          
          const token = generateToken();
          const guestData = {
            firstName: firstName?.trim(),
            lastName: lastName?.trim(),
            email: email?.trim() || null,
            token,
            createdAt: new Date(),
            rsvp: null,
            submittedAt: null,
            eventType: (eventType?.trim() === 'y' ? 'y' : 'x') as 'x' | 'y',
            eventSeriesId: eventSeriesId || null,
          };

          try {
            await setDoc(doc(db, 'guests', token), guestData);
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
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setImportStatus({ success: 0, failed: 1 });
        setIsImporting(false);
      }
    });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">Import Guests</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Upload CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-slate-300
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-pink-600 file:text-white
            hover:file:bg-pink-700
            file:cursor-pointer file:transition-colors
            border border-slate-600 rounded-md"
          disabled={isImporting}
        />
        <p className="text-xs text-slate-400 mt-2">
          CSV format: firstName,lastName,email,eventType (x or y)
        </p>
      </div>
      
      {isImporting && (
        <div className="flex items-center space-x-2 text-slate-300">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Importing guests...</span>
        </div>
      )}
      
      {importStatus && (
        <div className={`mt-4 p-3 rounded-md ${importStatus.failed > 0 ? 'bg-amber-900/20 text-amber-200' : 'bg-green-900/20 text-green-200'}`}>
          <p>
            {importStatus.success > 0 && `Successfully imported ${importStatus.success} guest${importStatus.success !== 1 ? 's' : ''}.`}
            {importStatus.failed > 0 && ` Failed to import ${importStatus.failed} guest${importStatus.failed !== 1 ? 's' : ''}.`}
          </p>
        </div>
      )}
    </div>
  );
} 