'use client';

import { useState, useEffect, useRef } from 'react';
import { parseISO } from 'date-fns';

interface CustomTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 48; // px
const HOURS_COUNT = 12;
const MINUTES_COUNT = 60;
const REPETITIONS = 3;

export default function CustomTimePicker({ value, onChange, onClose }: CustomTimePickerProps) {
  const [hours, setHours] = useState(() => {
    if (value) {
      const date = parseISO(`2000-01-01T${value}`);
      return date.getHours() % 12 || 12;
    }
    return 12;
  });
  const [minutes, setMinutes] = useState(() => {
    if (value) {
      const date = parseISO(`2000-01-01T${value}`);
      return date.getMinutes();
    }
    return 0;
  });
  const [isAM, setIsAM] = useState(() => {
    if (value) {
      const date = parseISO(`2000-01-01T${value}`);
      return date.getHours() < 12;
    }
    return true;
  });

  const pickerRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const handleTimeChange = (newHours: number, newMinutes: number, newIsAM: boolean) => {
    const finalHours = newIsAM ? newHours % 12 : (newHours % 12) + 12;
    const timeString = `${String(finalHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    onChange(timeString);
  };

  const handleHourClick = (hour: number) => {
    setHours(hour);
    handleTimeChange(hour, minutes, isAM);
  };

  const handleMinuteClick = (minute: number) => {
    setMinutes(minute);
    handleTimeChange(hours, minute, isAM);
  };

  const toggleAMPM = () => {
    const newIsAM = !isAM;
    setIsAM(newIsAM);
    handleTimeChange(hours, minutes, newIsAM);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);

  // Initialize scroll positions only on mount
  useEffect(() => {
    if (isInitialMount.current) {
      const centerValue = (ref: HTMLDivElement | null, isHours: boolean) => {
        if (!ref) return;
        const selectedIndex = isHours ? hours - 1 : minutes;
        // Position in the middle repetition
        const middleRepetitionOffset = isHours ? HOURS_COUNT : MINUTES_COUNT;
        const centerOffset = (ref.clientHeight - ITEM_HEIGHT) / 2;
        ref.scrollTop = (selectedIndex + middleRepetitionOffset) * ITEM_HEIGHT - centerOffset;
      };

      centerValue(hoursRef.current, true);
      centerValue(minutesRef.current, false);
      isInitialMount.current = false;
    }
  }, [hours, minutes]);

  return (
    <div 
      ref={pickerRef}
      className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-[var(--blossom-border)] p-4"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center space-x-2">
        {/* Hours Scroll */}
        <div className="relative h-[144px] w-16 overflow-hidden">
          <div 
            ref={hoursRef}
            className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex flex-col">
              {[...Array(HOURS_COUNT * REPETITIONS)].map((_, i) => {
                const hour = (i % HOURS_COUNT) + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleHourClick(hour)}
                    className={`h-12 flex items-center justify-center text-lg w-full ${
                      hour === hours 
                        ? 'text-[var(--blossom-pink-primary)] font-medium' 
                        : 'text-[var(--blossom-text-dark)] hover:bg-[var(--blossom-pink-light)]'
                    }`}
                  >
                    {String(hour).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* Minutes Scroll */}
        <div className="relative h-[144px] w-16 overflow-hidden">
          <div 
            ref={minutesRef}
            className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex flex-col">
              {[...Array(MINUTES_COUNT * REPETITIONS)].map((_, i) => {
                const minute = i % MINUTES_COUNT;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleMinuteClick(minute)}
                    className={`h-12 flex items-center justify-center text-lg w-full ${
                      minute === minutes 
                        ? 'text-[var(--blossom-pink-primary)] font-medium' 
                        : 'text-[var(--blossom-text-dark)] hover:bg-[var(--blossom-pink-light)]'
                    }`}
                  >
                    {String(minute).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* AM/PM Toggle */}
        <div className="flex flex-col space-y-2">
          <button
            type="button"
            onClick={toggleAMPM}
            className={`px-4 py-2 rounded transition-colors text-lg ${
              isAM 
                ? 'bg-[var(--blossom-pink-primary)] text-white' 
                : 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)]'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={toggleAMPM}
            className={`px-4 py-2 rounded transition-colors text-lg ${
              !isAM 
                ? 'bg-[var(--blossom-pink-primary)] text-white' 
                : 'bg-[var(--blossom-pink-light)] text-[var(--blossom-text-dark)]'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
} 