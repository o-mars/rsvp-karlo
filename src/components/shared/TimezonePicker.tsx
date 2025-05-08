'use client';

import { useState, useEffect, useRef } from 'react';

// Group timezones by region for better organization
const TIMEZONE_GROUPS = {
  'US & Canada': [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  ],
  'Europe': [
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Moscow', label: 'Moscow Time (MSK)' },
  ],
  'Asia & Pacific': [
    { value: 'Asia/Tokyo', label: 'Japan Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Time (CST)' },
    { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
    { value: 'Australia/Sydney', label: 'Sydney Time (AEST)' },
  ],
  'Other': [
    { value: 'UTC', label: 'UTC' },
    { value: 'GMT', label: 'GMT' },
  ],
};

interface TimezonePickerProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

export default function TimezonePicker({ value, onChange, className = '' }: TimezonePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter timezones based on search term
  const filteredGroups = Object.entries(TIMEZONE_GROUPS).reduce((acc, [group, timezones]) => {
    const filtered = timezones.filter(tz => 
      tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tz.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof TIMEZONE_GROUPS['US & Canada']>);

  const getCurrentTimezoneLabel = () => {
    const allTimezones = Object.values(TIMEZONE_GROUPS).flat();
    const timezone = allTimezones.find(tz => tz.value === value);
    return timezone?.label || value;
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)] flex items-center justify-between"
      >
        <span className="truncate">{getCurrentTimezoneLabel()}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--blossom-text-dark)]/70" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-[var(--blossom-border)] max-h-96 overflow-hidden">
          <div className="p-2 border-b border-[var(--blossom-border)]">
            <input
              type="text"
              placeholder="Search timezone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] p-2 rounded focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-[var(--blossom-pink-primary)]"
            />
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {Object.entries(filteredGroups).map(([group, timezones]) => (
              <div key={group}>
                <div className="px-3 py-2 text-sm font-medium text-[var(--blossom-text-dark)]/70 bg-[var(--blossom-pink-light)]">
                  {group}
                </div>
                {timezones.map((timezone) => (
                  <button
                    key={timezone.value}
                    type="button"
                    onClick={() => {
                      onChange(timezone.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[var(--blossom-pink-light)] ${
                      timezone.value === value ? 'bg-[var(--blossom-pink-light)] text-[var(--blossom-pink-primary)]' : 'text-[var(--blossom-text-dark)]'
                    }`}
                  >
                    {timezone.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
