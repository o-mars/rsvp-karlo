'use client';

import { useState, useEffect, useRef } from 'react';

const TIMEZONE_GROUPS = {
  'US & Canada': [
    'America/New_York',      // GMT-4 (EDT) / GMT-5 (EST)
    'America/Chicago',       // GMT-5 (CDT) / GMT-6 (CST)
    'America/Denver',        // GMT-6 (MDT) / GMT-7 (MST)
    'America/Los_Angeles',   // GMT-7 (PDT) / GMT-8 (PST)
    'America/Anchorage',     // GMT-8 (AKDT) / GMT-9 (AKST)
    'America/Phoenix',       // GMT-7 (MST) - No DST
    'America/Indiana/Indianapolis', // GMT-4 (EDT) / GMT-5 (EST)
    'America/Detroit',       // GMT-4 (EDT) / GMT-5 (EST)
    'America/Halifax',       // GMT-3 (ADT) / GMT-4 (AST)
    'America/St_Johns',      // GMT-2:30 (NDT) / GMT-3:30 (NST)
    'America/Vancouver',     // GMT-7 (PDT) / GMT-8 (PST)
    'America/Toronto',       // GMT-4 (EDT) / GMT-5 (EST)
    'America/Winnipeg',      // GMT-5 (CDT) / GMT-6 (CST)
    'America/Edmonton',      // GMT-6 (MDT) / GMT-7 (MST)
    'America/Regina',        // GMT-6 (CST) - No DST
    'America/Whitehorse',    // GMT-7 (PDT) / GMT-8 (PST)
    'America/Yellowknife',   // GMT-6 (MDT) / GMT-7 (MST)
    'America/Iqaluit',       // GMT-4 (EDT) / GMT-5 (EST)
    'America/Inuvik',        // GMT-6 (MDT) / GMT-7 (MST)
    'America/Dawson',        // GMT-7 (PDT) / GMT-8 (PST)
    'America/Dawson_Creek',  // GMT-7 (MST) - No DST
    'America/Fort_Nelson',   // GMT-7 (MST) - No DST
    'America/Creston',       // GMT-7 (MST) - No DST
    'America/Boise',         // GMT-6 (MDT) / GMT-7 (MST)
    'America/Shiprock',      // GMT-6 (MDT) / GMT-7 (MST)
    'America/Nome',          // GMT-8 (AKDT) / GMT-9 (AKST)
    'America/Adak',          // GMT-9 (HDT) / GMT-10 (HST)
    'America/Metlakatla',    // GMT-8 (AKST) - No DST
    'America/Sitka',         // GMT-8 (AKDT) / GMT-9 (AKST)
    'America/Juneau',        // GMT-8 (AKDT) / GMT-9 (AKST)
    'America/Yakutat',       // GMT-8 (AKDT) / GMT-9 (AKST)
    'Pacific/Honolulu',      // GMT-10 (HST) - No DST
  ],
  'Europe': [
    'Europe/London',         // GMT+1 (BST) / GMT+0 (GMT)
    'Europe/Paris',          // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Berlin',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Moscow',         // GMT+3 (MSK)
    'Europe/Amsterdam',      // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Athens',         // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Belgrade',       // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Bratislava',     // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Brussels',       // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Bucharest',      // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Budapest',       // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Copenhagen',     // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Dublin',         // GMT+1 (IST) / GMT+0 (GMT)
    'Europe/Helsinki',       // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Istanbul',       // GMT+3 (TRT)
    'Europe/Kiev',           // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Lisbon',         // GMT+1 (WEST) / GMT+0 (WET)
    'Europe/Ljubljana',      // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Luxembourg',     // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Madrid',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Malta',          // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Minsk',          // GMT+3 (MSK)
    'Europe/Monaco',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Oslo',           // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Prague',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Riga',           // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Rome',           // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Samara',         // GMT+4 (SAMT)
    'Europe/San_Marino',     // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Sarajevo',       // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Skopje',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Sofia',          // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Stockholm',      // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Tallinn',        // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Tirane',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Uzhgorod',       // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Vaduz',          // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Vatican',        // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Vienna',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Vilnius',        // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Volgograd',      // GMT+3 (MSK)
    'Europe/Warsaw',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Zagreb',         // GMT+2 (CEST) / GMT+1 (CET)
    'Europe/Zaporozhye',     // GMT+3 (EEST) / GMT+2 (EET)
    'Europe/Zurich',         // GMT+2 (CEST) / GMT+1 (CET)
  ],
  'Asia & Pacific': [
    'Asia/Tokyo',            // GMT+9 (JST)
    'Asia/Shanghai',         // GMT+8 (CST)
    'Asia/Singapore',        // GMT+8 (SGT)
    'Asia/Hong_Kong',        // GMT+8 (HKT)
    'Asia/Seoul',            // GMT+9 (KST)
    'Asia/Taipei',           // GMT+8 (CST)
    'Asia/Bangkok',          // GMT+7 (ICT)
    'Asia/Manila',           // GMT+8 (PHT)
    'Asia/Jakarta',          // GMT+7 (WIB)
    'Asia/Kuala_Lumpur',     // GMT+8 (MYT)
    'Asia/Ho_Chi_Minh',      // GMT+7 (ICT)
    // 'Asia/Hanoi',            // GMT+7 (ICT)
    'Asia/Baghdad',          // GMT+3 (AST)
    'Asia/Tehran',           // GMT+3:30 (IRST)
    'Asia/Dubai',            // GMT+4 (GST)
    'Asia/Karachi',          // GMT+5 (PKT)
    'Asia/Kolkata',          // GMT+5:30 (IST)
    'Asia/Colombo',          // GMT+5:30 (IST)
    'Asia/Kathmandu',        // GMT+5:45 (NPT)
    'Asia/Dhaka',            // GMT+6 (BST)
    'Asia/Yangon',           // GMT+6:30 (MMT)
    'Asia/Phnom_Penh',       // GMT+7 (ICT)
    'Asia/Vientiane',        // GMT+7 (ICT)
    'Asia/Brunei',           // GMT+8 (BNT)
    'Asia/Makassar',         // GMT+8 (WITA)
    'Asia/Jayapura',         // GMT+9 (WIT)
    'Asia/Pontianak',        // GMT+7 (WIB)
    'Australia/Sydney',      // GMT+10 (AEST) / GMT+11 (AEDT)
    'Australia/Melbourne',   // GMT+10 (AEST) / GMT+11 (AEDT)
    'Australia/Brisbane',    // GMT+10 (AEST)
    'Australia/Adelaide',    // GMT+9:30 (ACST) / GMT+10:30 (ACDT)
    'Australia/Perth',       // GMT+8 (AWST)
    'Australia/Darwin',      // GMT+9:30 (ACST)
    'Australia/Hobart',      // GMT+10 (AEST) / GMT+11 (AEDT)
    'Pacific/Auckland',      // GMT+12 (NZST) / GMT+13 (NZDT)
    'Pacific/Fiji',          // GMT+12 (FJT)
    'Pacific/Guam',          // GMT+10 (ChST)
    'Pacific/Port_Moresby',  // GMT+10 (PGT)
    'Pacific/Tongatapu',     // GMT+13 (TOT)
  ],
  'Africa & Middle East': [
    'Africa/Cairo',          // GMT+2 (EET)
    'Africa/Johannesburg',   // GMT+2 (SAST)
    'Africa/Lagos',          // GMT+1 (WAT)
    'Africa/Nairobi',        // GMT+3 (EAT)
    'Africa/Casablanca',     // GMT+1 (WET)
    'Africa/Addis_Ababa',    // GMT+3 (EAT)
    'Africa/Algiers',        // GMT+1 (CET)
    'Africa/Asmara',         // GMT+3 (EAT)
    'Africa/Bamako',         // GMT+0 (GMT)
    'Africa/Bangui',         // GMT+1 (WAT)
    'Africa/Banjul',         // GMT+0 (GMT)
    'Africa/Bissau',         // GMT+0 (GMT)
    'Africa/Blantyre',       // GMT+2 (CAT)
    'Africa/Brazzaville',    // GMT+1 (WAT)
    'Africa/Bujumbura',      // GMT+2 (CAT)
    'Africa/Conakry',        // GMT+0 (GMT)
    'Africa/Dakar',          // GMT+0 (GMT)
    'Africa/Dar_es_Salaam',  // GMT+3 (EAT)
    'Africa/Djibouti',       // GMT+3 (EAT)
    'Africa/Douala',         // GMT+1 (WAT)
    'Africa/El_Aaiun',       // GMT+1 (WET)
    'Africa/Freetown',       // GMT+0 (GMT)
    'Africa/Gaborone',       // GMT+2 (CAT)
    'Africa/Harare',         // GMT+2 (CAT)
    'Africa/Kampala',        // GMT+3 (EAT)
    'Africa/Khartoum',       // GMT+2 (CAT)
    'Africa/Kigali',         // GMT+2 (CAT)
    'Africa/Kinshasa',       // GMT+1 (WAT)
    'Africa/Libreville',     // GMT+1 (WAT)
    'Africa/Lome',           // GMT+0 (GMT)
    'Africa/Luanda',         // GMT+1 (WAT)
    'Africa/Lubumbashi',     // GMT+2 (CAT)
    'Africa/Lusaka',         // GMT+2 (CAT)
    'Africa/Malabo',         // GMT+1 (WAT)
    'Africa/Maputo',         // GMT+2 (CAT)
    'Africa/Maseru',         // GMT+2 (SAST)
    'Africa/Mbabane',        // GMT+2 (SAST)
    'Africa/Mogadishu',      // GMT+3 (EAT)
    'Africa/Monrovia',       // GMT+0 (GMT)
    'Africa/Ndjamena',       // GMT+1 (WAT)
    'Africa/Niamey',         // GMT+1 (WAT)
    'Africa/Nouakchott',     // GMT+0 (GMT)
    'Africa/Ouagadougou',    // GMT+0 (GMT)
    'Africa/Porto-Novo',     // GMT+1 (WAT)
    'Africa/Sao_Tome',       // GMT+0 (GMT)
    'Africa/Tripoli',        // GMT+2 (EET)
    'Africa/Tunis',          // GMT+1 (CET)
    'Africa/Windhoek',       // GMT+2 (CAT)
  ],
  'South America': [
    'America/Sao_Paulo',     // GMT-3 (BRT)
    'America/Argentina/Buenos_Aires', // GMT-3 (ART)
    'America/Santiago',      // GMT-4 (CLT) / GMT-3 (CLST)
    'America/Bogota',        // GMT-5 (COT)
    'America/Caracas',       // GMT-4 (VET)
    'America/Lima',          // GMT-5 (PET)
    'America/La_Paz',        // GMT-4 (BOT)
    'America/Asuncion',      // GMT-4 (PYT) / GMT-3 (PYST)
    'America/Montevideo',    // GMT-3 (UYT)
    'America/Guayaquil',     // GMT-5 (ECT)
    'America/Cayenne',       // GMT-3 (GFT)
    'America/Guyana',        // GMT-4 (GYT)
    'America/Paramaribo',    // GMT-3 (SRT)
    'America/Belem',         // GMT-3 (BRT)
    'America/Fortaleza',     // GMT-3 (BRT)
    'America/Recife',        // GMT-3 (BRT)
    'America/Araguaina',     // GMT-3 (BRT)
    'America/Maceio',        // GMT-3 (BRT)
    // 'America/Salvador',      // GMT-3 (BRT)
    'America/Bahia',         // GMT-3 (BRT)
    'America/Campo_Grande',  // GMT-4 (AMT)
    'America/Cuiaba',        // GMT-4 (AMT)
    'America/Santarem',      // GMT-3 (BRT)
    'America/Porto_Velho',   // GMT-4 (AMT)
    'America/Boa_Vista',     // GMT-4 (AMT)
    'America/Manaus',        // GMT-4 (AMT)
    'America/Eirunepe',      // GMT-5 (ACT)
    'America/Rio_Branco',    // GMT-5 (ACT)
  ],
  'Other': [
    'UTC',                   // GMT+0
    'GMT',                   // GMT+0
    'Etc/GMT',              // GMT+0
    'Etc/GMT+1',            // GMT-1
    'Etc/GMT+2',            // GMT-2
    'Etc/GMT+3',            // GMT-3
    'Etc/GMT+4',            // GMT-4
    'Etc/GMT+5',            // GMT-5
    'Etc/GMT+6',            // GMT-6
    'Etc/GMT+7',            // GMT-7
    'Etc/GMT+8',            // GMT-8
    'Etc/GMT+9',            // GMT-9
    'Etc/GMT+10',           // GMT-10
    'Etc/GMT+11',           // GMT-11
    'Etc/GMT+12',           // GMT-12
    'Etc/GMT-1',            // GMT+1
    'Etc/GMT-2',            // GMT+2
    'Etc/GMT-3',            // GMT+3
    'Etc/GMT-4',            // GMT+4
    'Etc/GMT-5',            // GMT+5
    'Etc/GMT-6',            // GMT+6
    'Etc/GMT-7',            // GMT+7
    'Etc/GMT-8',            // GMT+8
    'Etc/GMT-9',            // GMT+9
    'Etc/GMT-10',           // GMT+10
    'Etc/GMT-11',           // GMT+11
    'Etc/GMT-12',           // GMT+12
  ],
};

// Helper function to format timezone label
const formatTimezoneLabel = (timezone: string): string => {
  try {
    // const date = new Date();
    // const formatter = new Intl.DateTimeFormat('en-US', {
    //   timeZone: timezone,
    //   timeZoneName: 'short',
    // });
    
    // const parts = formatter.formatToParts(date);
    // const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
    
    // Extract the GMT offset from the timezone name (e.g., "GMT-4" from "EDT")
    // const offset = timeZoneName.replace(/[^+-0-9:]/g, '');
    const parts = timezone.split('/');
    return parts.length < 3 ? `${timezone}` : `${parts[0]}/${parts[parts.length - 1]}`;
  } catch (error) {
    console.error('Error formatting timezone label:', error);
    return timezone;
  }
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
      tz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatTimezoneLabel(tz).toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const getCurrentTimezoneLabel = () => {
    return formatTimezoneLabel(value);
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
                    key={timezone}
                    type="button"
                    onClick={() => {
                      onChange(timezone);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[var(--blossom-pink-light)] ${
                      timezone === value ? 'bg-[var(--blossom-pink-light)] text-[var(--blossom-pink-primary)]' : 'text-[var(--blossom-text-dark)]'
                    }`}
                  >
                    {formatTimezoneLabel(timezone)}
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
