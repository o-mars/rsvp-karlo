'use client';

import { useRef, useState, useEffect, KeyboardEvent } from 'react';

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
  className?: string;
}

export default function TimeInput({
  id,
  label,
  value,
  onChange,
  required = false,
  className = ''
}: TimeInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleTimeClick = () => {
    // Focus the time input to open the native time picker
    if (hiddenInputRef.current) {
      hiddenInputRef.current.showPicker?.();
    }
    setIsFocused(true);
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent's onClick from firing
    onChange('');
  };

  // Handle keyboard events on the display div
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // If backspace is pressed and the field is optional, clear the value
    if (e.key === 'Backspace' && !required) {
      onChange('');
    }
  };

  // Format time for display
  const formatTimeForDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  // Handle clicks outside to remove focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (displayRef.current && !displayRef.current.contains(event.target as Node)) {
        setIsFocused(false);
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
      <div className="relative" ref={displayRef}>
        {/* Visible display field with clock icon */}
        <div
          onClick={handleTimeClick}
          onKeyDown={handleKeyDown}
          className="bg-slate-700 border border-slate-600 text-white p-2 pr-10 rounded cursor-pointer hover:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 w-full flex items-center group"
          tabIndex={0} // Make div focusable for keyboard events
          role="button"
          aria-label={`Select ${label}`}
        >
          <span className="flex-grow">
            {value ? formatTimeForDisplay(value) : 'Select a time'}
          </span>

          {/* Clock icon or X icon for clearing */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {!required && value && (
              <button
                type="button"
                onClick={handleClearClick}
                className="text-slate-400 hover:text-pink-500 transition-colors z-10 mr-5 focus:outline-none"
                aria-label="Clear time"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white group-hover:text-pink-500 transition-colors pointer-events-none" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>

        {/* Hidden input that handles the actual time selection */}
        <input
          ref={hiddenInputRef}
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only" // Hidden from view but still functional
          required={required}
          aria-hidden="true"
        />
        
        {/* Optional clear button below input when focused (mobile-friendly) */}
        {!required && value && isFocused && (
          <div className="absolute right-0 mt-1 z-10">
            <button
              type="button"
              onClick={handleClearClick}
              className="bg-slate-800 text-white px-3 py-1 rounded-md text-sm shadow-md hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 