'use client';

import { useEffect, useRef, useState } from 'react';
import CustomDatePicker from './CustomDatePicker';

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
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
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
    setIsOpen(true);
  };

  // Close date picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={className} ref={datePickerRef}>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--blossom-text-dark)]/70 mb-1">
        {label}
      </label>
      <div className="relative">
        {/* Visible display field with calendar icon */}
        <div
          onClick={handleDateClick}
          className="bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 pr-10 rounded cursor-pointer hover:border-[var(--blossom-pink-primary)] focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] w-full flex items-center group"
        >
          <span className={`flex-grow ${value ? 'text-[var(--blossom-text-dark)]' : 'text-[var(--blossom-text-dark)]/50'}`}>
            {value ? formatDateForDisplay(value) : 'Select a date'}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 ${value ? 'text-[var(--blossom-pink-primary)]' : 'text-[var(--blossom-text-dark)]/50'} group-hover:text-[var(--blossom-pink-primary)] transition-colors`} 
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

        {/* Hidden input for form submission */}
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          required={required}
          aria-hidden="true"
        />

        {/* Custom Date Picker */}
        {isOpen && (
          <CustomDatePicker
            value={value}
            onChange={onChange}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
} 