'use client';

import { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

export default function CustomDatePicker({ value, onChange, onClose }: CustomDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const date = parseISO(value);
      return startOfMonth(date);
    }
    return startOfMonth(new Date());
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : null;

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Calculate padding days for the start of the month
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const paddingDays = Array(startingDayIndex).fill(null);

  const handleDateClick = (date: Date) => {
    // Preserve the time from the selected date if it exists
    const newDate = new Date(date);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    }
    onChange(format(newDate, 'yyyy-MM-dd'));
    onClose();
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        onClose();
      }
    };

    // Use capture phase to handle the event before it reaches the target
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-[var(--blossom-border)] p-4"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-[var(--blossom-pink-light)] rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--blossom-text-dark)]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-[var(--blossom-text-dark)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-[var(--blossom-pink-light)] rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--blossom-text-dark)]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm text-[var(--blossom-text-dark)]/70 py-1">
            {day}
          </div>
        ))}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="p-2" />
        ))}
        {days.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <button
              type="button"
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={`
                p-2 text-sm rounded-full transition-colors
                ${isSelected 
                  ? 'bg-[var(--blossom-pink-primary)] text-white' 
                  : isCurrentDay 
                    ? 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)]' 
                    : isCurrentMonth 
                      ? 'text-[var(--blossom-text-dark)] hover:bg-[var(--blossom-pink-light)]' 
                      : 'text-[var(--blossom-text-dark)]/30'
                }
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
} 