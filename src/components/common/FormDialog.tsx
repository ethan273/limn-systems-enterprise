"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormFieldError, FormErrorSummary } from './FormFieldError';

/**
 * Supported form field types
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'select'
  | 'textarea'
  | 'date'
  | 'checkbox'
  | 'password'
  | 'file';

/**
 * Validation configuration for form fields
 */
export interface FormFieldValidation {
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

/**
 * Option for select fields
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Form field configuration
 */
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[]; // for select fields
  defaultValue?: unknown;
  validation?: FormFieldValidation;
  accept?: string; // for file inputs
  helperText?: string; // helper text below field
}

/**
 * FormDialog component props
 */
export interface FormDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

/**
 * FormDialog - A generic, reusable form dialog component
 *
 * Features:
 * - Support for multiple field types (text, email, number, select, textarea, date, checkbox, password)
 * - Built-in validation (required fields, email format, min/max, regex patterns)
 * - Loading states during submission
 * - Error handling and display
 * - Flexible configuration via props
 * - Uses only global CSS classes (no inline Tailwind utilities)
 *
 * @example
 * ```tsx
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Add New Customer"
 *   description="Create a new customer record"
 *   fields={[
 *     { name: 'name', label: 'Customer Name', type: 'text', required: true },
 *     { name: 'email', label: 'Email', type: 'email', required: true },
 *     { name: 'status', label: 'Status', type: 'select', options: [...], required: true },
 *   ]}
 *   onSubmit={async (data) => {
 *     await createCustomer(data);
 *   }}
 *   isLoading={isCreating}
 * />
 * ```
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
}: FormDialogProps) {
  // Form state
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data with default values
  useEffect(() => {
    if (!open) return;

    const initialData: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      } else if (field.type === 'checkbox') {
        initialData[field.name] = false;
      } else {
        initialData[field.name] = '';
      }
    });
    setFormData(initialData);
    setErrors({});
  }, [fields, open]);

  /**
   * Validate a single field
   */
  const validateField = (field: FormField, value: unknown): string | null => {
    // Required field validation
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    const stringValue = String(value);

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return 'Please enter a valid email address';
      }
    }

    // Number validation
    if (field.type === 'number' && value) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return 'Please enter a valid number';
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `Minimum value is ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `Maximum value is ${field.validation.max}`;
      }
    }

    // Pattern validation
    if (field.validation?.pattern && value) {
      if (!field.validation.pattern.test(stringValue)) {
        return field.validation.message || 'Invalid format';
      }
    }

    return null;
  };

  /**
   * Validate all fields
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[FormDialog] Submit triggered', { title, formData });

    if (!validateForm()) {
      console.log('[FormDialog] Validation failed');
      return;
    }

    console.log('[FormDialog] Validation passed, calling onSubmit...');

    try {
      console.log('[FormDialog] About to call onSubmit with data:', formData);
      await onSubmit(formData);
      console.log('[FormDialog] onSubmit completed successfully');

      // Clear form on successful submit
      const clearedData: Record<string, unknown> = {};
      fields.forEach((field) => {
        clearedData[field.name] = field.type === 'checkbox' ? false : '';
      });
      setFormData(clearedData);
      setErrors({});
      onOpenChange(false);
      console.log('[FormDialog] Dialog closed');
    } catch (error) {
      // Error handling - errors from onSubmit will be caught here
      console.error('[FormDialog] Form submission error:', error);
      console.error('[FormDialog] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  /**
   * Handle field value change
   */
  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
    // Clear error for this field when user starts typing
    if (Object.prototype.hasOwnProperty.call(errors, fieldName)) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        // eslint-disable-next-line security/detect-object-injection
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  /**
   * Render a form field based on its type
   */
  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <div key={field.name} className="form-field">
            <Label
              htmlFor={field.name}
              className={field.required ? 'form-label form-label-required' : 'form-label'}
            >
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={String(value || '')}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isLoading}
            />
            <FormFieldError error={error} id={`${field.name}-error`} />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="form-field">
            <Label
              htmlFor={field.name}
              className={field.required ? 'form-label form-label-required' : 'form-label'}
            >
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              placeholder={field.placeholder}
              value={String(value || '')}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isLoading}
              min={field.validation?.min}
              max={field.validation?.max}
            />
            <FormFieldError error={error} id={`${field.name}-error`} />
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="form-field">
            <Label
              htmlFor={field.name}
              className={field.required ? 'form-label form-label-required' : 'form-label'}
            >
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="date"
              value={String(value || '')}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isLoading}
            />
            <FormFieldError error={error} id={`${field.name}-error`} />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="form-field">
            <Label
              htmlFor={field.name}
              className={field.required ? 'form-label form-label-required' : 'form-label'}
            >
              {field.label}
            </Label>
            <Textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              value={String(value || '')}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isLoading}
            />
            <FormFieldError error={error} id={`${field.name}-error`} />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="form-field">
            <Label
              htmlFor={field.name}
              className={field.required ? 'form-label form-label-required' : 'form-label'}
            >
              {field.label}
            </Label>
            <Select
              value={String(value || '')}
              onValueChange={(newValue) => handleFieldChange(field.name, newValue)}
              disabled={isLoading}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError error={error} id={`${field.name}-error`} />
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="form-checkbox-field">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              disabled={isLoading}
            />
            <Label
              htmlFor={field.name}
              className={field.required ? 'form-label form-label-required' : 'form-label'}
            >
              {field.label}
            </Label>
            <FormFieldError error={error} id={`${field.name}-error`} />
          </div>
        );

      case 'file':
        return (
          <div key={field.name} className="form-field">
            <Label
              htmlFor={field.name}
              className={field.required ? 'form-label form-label-required' : 'form-label'}
            >
              {field.label}
            </Label>
            {typeof field.defaultValue === 'string' && field.defaultValue ? (
              <div className="mb-2 flex items-center gap-2 p-2 border border-border rounded bg-muted/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={field.defaultValue}
                  alt="Current image"
                  className="w-16 h-16 object-cover rounded border border-border"
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Current image</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFieldChange(field.name, null)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive h-auto p-0 mt-1"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : null}
            <Input
              id={field.name}
              name={field.name}
              type="file"
              accept={field.accept || 'image/*'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFieldChange(field.name, file);
                }
              }}
              disabled={isLoading}
            />
            {field.helperText && (
              <p className="text-sm text-muted-foreground mt-1">{field.helperText}</p>
            )}
            <FormFieldError error={error} id={`${field.name}-error`} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Error Summary */}
          <FormErrorSummary errors={errors} />

          {fields.map((field) => renderField(field))}

          <DialogFooter className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
