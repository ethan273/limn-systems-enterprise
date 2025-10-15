'use client';

/**
 * EditableField Component
 *
 * A field that can toggle between read-only and editable modes.
 * Used in detail pages to enable in-place editing without modals.
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface EditableFieldProps {
  label?: string;
  value: string | number | null | undefined;
  type?: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'date';
  isEditing?: boolean;
  onChange?: (_value: string) => void;
  onSave?: (_value: string) => void; // Alias for onChange for backward compatibility
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  prefix?: string;
  suffix?: string | React.ReactNode;
}

export function EditableField({
  label,
  value,
  type = 'text',
  isEditing = false,
  onChange,
  onSave,
  placeholder,
  options = [],
  className,
  required = false,
  icon: Icon,
  
  
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || '');

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    // Support both onChange and onSave (onSave is for backward compatibility)
    onChange?.(newValue);
    onSave?.(newValue);
  };

  const displayValue = value || '—';

  return (
    <div className={cn('editable-field-group', className)}>
      {label && (
        <label className="editable-field-label">
          {Icon && <Icon className="icon-xs" aria-hidden="true" />}
          {label}
          {required && isEditing && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {isEditing ? (
        <div className="editable-field-input">
          {type === 'textarea' ? (
            <Textarea
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder || (label ? `Enter ${label.toLowerCase()}` : 'Enter value')}
              required={required}
              rows={4}
            />
          ) : type === 'select' && options.length > 0 ? (
            <Select value={localValue} onValueChange={handleChange}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder || (label ? `Select ${label.toLowerCase()}` : 'Select option')} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={type === 'email' ? 'email' : type === 'phone' ? 'tel' : type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder || (label ? `Enter ${label.toLowerCase()}` : 'Enter value')}
              required={required}
            />
          )}
        </div>
      ) : (
        <div className="editable-field-value">
          {type === 'email' && value ? (
            <a href={`mailto:${value}`} className="text-primary hover:underline">
              {displayValue}
            </a>
          ) : type === 'phone' && value ? (
            <a href={`tel:${value}`} className="text-primary hover:underline">
              {displayValue}
            </a>
          ) : type === 'textarea' ? (
            <p className="whitespace-pre-wrap">{displayValue}</p>
          ) : (
            <span>{displayValue}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * EditableFieldGroup Component
 *
 * Groups multiple editable fields together in a grid layout
 */
export interface EditableFieldGroupProps {
  title: string;
  isEditing: boolean;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

export function EditableFieldGroup({
  title,
  isEditing,
  children,
  columns = 2,
}: EditableFieldGroupProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {isEditing && (
          <p className="text-sm text-muted mt-1">
            Edit the fields below and click &quot;Save Changes&quot; to update.
          </p>
        )}
      </div>
      <div className={cn(
        'card-content',
        columns === 1 && 'grid gap-6',
        columns === 2 && 'grid grid-cols-1 md:grid-cols-2 gap-6',
        columns === 3 && 'grid grid-cols-1 md:grid-cols-3 gap-6'
      )}>
        {children}
      </div>
    </div>
  );
}
