/**
 * TableFilters Components
 *
 * Controlled filter components that work with useTableFilters hook.
 * These replace DataTable's internal filtering with explicit controlled components.
 *
 * Components:
 * - SearchFilter: Text search input with icon
 * - SelectFilter: Dropdown select for categorical filters
 * - DateRangeFilter: From/To date inputs
 * - FilterBar: Container for filter layout with clear button
 */

'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================================
// SearchFilter Component
// ============================================================================

export interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchFilterProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}

// ============================================================================
// SelectFilter Component
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SelectFilter({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  className = '',
}: SelectFilterProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================================
// DateRangeFilter Component
// ============================================================================

export interface DateRangeFilterProps {
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
}

export function DateRangeFilter({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromLabel = 'From Date',
  toLabel = 'To Date',
  className = '',
}: DateRangeFilterProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* From Date */}
      <div className="space-y-2">
        <label htmlFor="date-from" className="text-sm font-medium text-foreground">
          {fromLabel}
        </label>
        <Input
          id="date-from"
          type="date"
          value={fromValue}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>

      {/* To Date */}
      <div className="space-y-2">
        <label htmlFor="date-to" className="text-sm font-medium text-foreground">
          {toLabel}
        </label>
        <Input
          id="date-to"
          type="date"
          value={toValue}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ============================================================================
// FilterBar Component
// ============================================================================

export interface FilterBarProps {
  children: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({
  children,
  onClearFilters,
  hasActiveFilters = false,
  className = '',
}: FilterBarProps) {
  return (
    <div className={`card mb-6 ${className}`}>
      <div className="p-4">
        <div className="space-y-4">
          {/* Filter Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {children}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && onClearFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Compound Export
// ============================================================================

export const TableFilters = {
  Search: SearchFilter,
  Select: SelectFilter,
  DateRange: DateRangeFilter,
  Bar: FilterBar,
};
