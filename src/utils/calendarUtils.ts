export function generateICSFile(event: {
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  occasionAlias?: string;
}): string {
  // Create date in local time
  const [year, month, day] = event.date.split('-').map(Number);
  const [hours, minutes] = event.time.split(':').map(Number);
  const eventDate = new Date(year, month - 1, day, hours, minutes);
  
  // Format date for ICS (YYYYMMDDTHHmmss)
  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  };

  const escapeText = (text: string) => {
    return text
      .replace(/[\\;,]/g, '\\$&') // Escape special characters
      .replace(/\n/g, '\\n');     // Convert newlines to \n
  };

  // Create event name with occasion alias if available
  const eventName = event.occasionAlias 
    ? `${event.occasionAlias}: ${event.name}`
    : event.name;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RSVP App//Calendar Event//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(eventDate)}`,
    `DTEND:${formatDate(new Date(eventDate.getTime() + 60 * 60 * 1000))}`, // 1 hour duration
    `SUMMARY:${escapeText(eventName)}`,
    `LOCATION:${escapeText(event.location)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return icsContent;
}

export function downloadICSFile(event: {
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  occasionAlias?: string;
}) {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  
  const eventName = event.occasionAlias 
    ? `${event.occasionAlias}_${event.name}`
    : event.name;
    
  const sanitizeFilename = (name: string) => {
    return name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\-_\.]/g, '_')
      .replace(/^_|_$/g, '');
  };
    
  link.download = `${sanitizeFilename(eventName)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 