'use client';

import { useRef, useState, useEffect } from 'react';
import CustomTimePicker from './CustomTimePicker';

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
  const [isOpen, setIsOpen] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

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

  const handleTimeClick = () => {
    setIsOpen(true);
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Close time picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (displayRef.current && !displayRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={className} ref={displayRef}>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
        {label}
      </label>
      <div className="relative">
        {/* Visible display field with clock icon */}
        <div
          onClick={handleTimeClick}
          className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 pr-10 rounded cursor-pointer hover:border-[var(--blossom-pink-primary)] focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full flex items-center group"
        >
          <span className={`flex-grow ${value ? 'text-[var(--blossom-text-dark)]' : 'text-[var(--blossom-text-dark)]/50'}`}>
            {value ? formatTimeForDisplay(value) : 'Select a time'}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {!required && value && (
              <button
                type="button"
                onClick={handleClearClick}
                className="text-[var(--blossom-text-dark)]/50 hover:text-[var(--blossom-pink-primary)] transition-colors z-10 mr-5 focus:outline-none"
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
              className={`h-5 w-5 ${value ? 'text-[var(--blossom-pink-primary)]' : 'text-[var(--blossom-text-dark)]/50'} group-hover:text-[var(--blossom-pink-primary)] transition-colors pointer-events-none`} 
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

        {/* Hidden input for form submission */}
        <input
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          required={required}
          aria-hidden="true"
        />

        {/* Custom Time Picker */}
        {isOpen && (
          <CustomTimePicker
            value={value}
            onChange={onChange}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
} 