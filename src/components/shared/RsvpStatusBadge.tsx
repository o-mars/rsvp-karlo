'use client';

import { RsvpStatus } from '@/src/models/interfaces';

interface RsvpStatusBadgeProps {
  status: string | undefined;
  className?: string;
}

export default function RsvpStatusBadge({ status, className = '' }: RsvpStatusBadgeProps) {
  const getStatusClass = (status: string | undefined) => {
    switch (status) {
      case RsvpStatus.ATTENDING:
        return 'bg-green-100 text-green-800';
      case RsvpStatus.NOT_ATTENDING:
        return 'bg-red-100 text-red-800';
      case RsvpStatus.AWAITING_RESPONSE:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(status)} ${className}`}>
      {status || 'Not Invited'}
    </span>
  );
} 