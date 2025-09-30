"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createDualDimension, type DualDimension, type DimensionUnit, formatDimension, validateDimension } from '@/lib/utils/unit-conversion';

interface DimensionInputProps {
  label: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: DualDimension | null) => void;
  value?: DualDimension | null;
  defaultUnit?: DimensionUnit;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
  description?: string;
}

export function DimensionInput({
  label,
  value,
  onChange,
  defaultUnit = 'inches',
  required = false,
  disabled = false,
  placeholder,
  className,
  error,
  description,
}: DimensionInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [activeUnit, setActiveUnit] = useState<DimensionUnit>(defaultUnit);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');

  // Update input value when prop value changes
  useEffect(() => {
    if (value) {
      const displayValue = activeUnit === 'inches' ? value.inches : value.cm;
      setInputValue(displayValue?.toString() || '');
    } else {
      setInputValue('');
    }
  }, [value, activeUnit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);

    // Clear previous validation
    setIsValid(true);
    setValidationError('');

    if (rawValue === '') {
      onChange(null);
      return;
    }

    const numericValue = parseFloat(rawValue);

    // Validate the input
    const validation = validateDimension(numericValue);
    if (!validation.valid) {
      setIsValid(false);
      setValidationError(validation.error || 'Invalid dimension');
      return;
    }

    // Create dual dimension and call onChange
    const dualDimension = createDualDimension(numericValue, activeUnit);
    onChange(dualDimension);
  };

  const toggleUnit = () => {
    const newUnit = activeUnit === 'inches' ? 'cm' : 'inches';
    setActiveUnit(newUnit);

    // If we have a value, update the input display
    if (value) {
      const displayValue = newUnit === 'inches' ? value.inches : value.cm;
      setInputValue(displayValue?.toString() || '');
    }
  };

  const getDisplayValues = () => {
    if (!value) return null;
    return {
      inches: formatDimension(value.inches, 'inches'),
      cm: formatDimension(value.cm, 'cm'),
    };
  };

  const displayValues = getDisplayValues();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={label} className="text-sm font-medium text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleUnit}
          disabled={disabled}
          className="h-6 px-2 text-xs"
        >
          {activeUnit === 'inches' ? 'in' : 'cm'}
        </Button>
      </div>

      <div className="space-y-1">
        <Input
          id={label}
          type="number"
          step="0.01"
          min="0"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()} in ${activeUnit === 'inches' ? 'inches' : 'centimeters'}`}
          disabled={disabled}
          className={`
            ${!isValid || error ? 'border-red-500 focus:border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {/* Show converted value */}
        {displayValues && (
          <div className="flex gap-2 text-xs text-gray-400">
            <Badge variant="outline" className="text-xs py-0 px-2">
              {displayValues.inches}
            </Badge>
            <Badge variant="outline" className="text-xs py-0 px-2">
              {displayValues.cm}
            </Badge>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}

        {/* Validation Error */}
        {(!isValid || error) && (
          <p className="text-xs text-red-400">
            {validationError || error}
          </p>
        )}
      </div>
    </div>
  );
}

export default DimensionInput;