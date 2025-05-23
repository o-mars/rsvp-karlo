import { Timestamp } from 'firebase/firestore';

export const convertToTimezone = (date: Date | Timestamp, timezone: string): Date => {
  const timestamp = date instanceof Timestamp ? date.toDate() : date;
  return new Date(timestamp.toLocaleString('en-US', { timeZone: timezone }));
};

export const formatDateInTimezone = (
  date: Date | Timestamp,
  timezone: string,
  options: Intl.DateTimeFormatOptions
): string => {
  const dateInTimezone = convertToTimezone(date, timezone);
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: timezone
  }).format(dateInTimezone);
};

export const createDateInTimezone = (
  dateStr: string,
  timeStr: string,
  timezone: string
): Date => {
  // Create a date string in ISO format
  const dateTimeStr = `${dateStr}T${timeStr}`;
  
  // Create a date object in the specified timezone
  const date = new Date(dateTimeStr);
  
  // Get the timezone offset in minutes for the target timezone
  const targetTzOffset = new Date(dateTimeStr).toLocaleString('en-US', { timeZone: timezone });
  const targetDate = new Date(targetTzOffset);
  const targetOffset = targetDate.getTimezoneOffset();
  
  // Get the local timezone offset
  const localOffset = date.getTimezoneOffset();
  
  // Adjust the date by the difference in timezone offsets
  const offsetDiff = targetOffset - localOffset;
  date.setMinutes(date.getMinutes() + offsetDiff);
  
  return date;
}; 