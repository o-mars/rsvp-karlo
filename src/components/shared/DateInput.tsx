'use client';

import { useEffect, useRef } from 'react';

interface DateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
  className?: string;
}

export default function DateInput({
  id,
  label,
  value,
  onChange,
  required = false,
  className = ''
}: DateInputProps) {
  const datePickerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      // Add time to ensure we're working with the correct day in local timezone
      const date = new Date(`${dateStr}T12:00:00`);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const handleDateClick = () => {
    // Directly open the browser's native date picker
    if (hiddenInputRef.current) {
      hiddenInputRef.current.showPicker?.();
    }
  };

  // Close date picker on outside click (for browsers where showPicker isn't supported)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        // If we need future functionality for closing custom date pickers
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <div ref={datePickerRef} className="relative">
        {/* Visible display field with calendar icon */}
        <div
          onClick={handleDateClick}
          className="bg-slate-700 border border-slate-600 text-white p-2 pr-10 rounded cursor-pointer hover:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 w-full flex items-center group"
        >
          <span className="flex-grow">
            {value ? formatDateForDisplay(value) : 'Select a date'}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white group-hover:text-pink-500 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>

        {/* Hidden input that handles the actual date selection */}
        <input
          ref={hiddenInputRef}
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only" // Hidden from view but still functional
          required={required}
          aria-hidden="true"
        />
      </div>
    </div>
  );
} 