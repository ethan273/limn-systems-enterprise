'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  value: string;
  onChange: (_value: string) => void;
  className?: string;
}

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

export function DateRangeSelector({ value: currentValue, onChange, className }: DateRangeSelectorProps) {
  return (
    <div className={`date-range-selector ${className || ''}`}>
      <Select value={currentValue} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <Calendar className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
