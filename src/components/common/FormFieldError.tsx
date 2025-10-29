"use client";

/**
 * Form Field Error Component
 *
 * Provides consistent, accessible error messaging for form fields.
 *
 * Features:
 * - WCAG 2.1 AA compliant
 * - Announces errors to screen readers
 * - Visual error states
 * - Animation support
 * - Mobile-friendly (touch targets)
 *
 * Usage:
 * ```tsx
 * <FormField>
 *   <Label>Email</Label>
 *   <Input {...register('email')} />
 *   <FormFieldError error={errors.email} />
 * </FormField>
 * ```
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldError } from 'react-hook-form';

export interface FormFieldErrorProps {
  error?: FieldError | string;
  className?: string;
  id?: string; // For aria-describedby
}

export function FormFieldError({ error, className, id }: FormFieldErrorProps) {
  // Extract error message
  const message = typeof error === 'string' ? error : error?.message;

  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 mt-2 text-sm text-destructive',
        'animate-in slide-in-from-top-1 duration-200',
        className
      )}
    >
      <AlertCircle
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        aria-hidden="true"
      />
      <span>{message}</span>
    </p>
  );
}

/**
 * Form Field Helper Text (non-error)
 */
export interface FormFieldHelperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormFieldHelper({ children, className, id }: FormFieldHelperProps) {
  return (
    <p
      id={id}
      className={cn(
        'mt-2 text-sm text-muted-foreground',
        className
      )}
    >
      {children}
    </p>
  );
}

/**
 * Form Field Wrapper with Error Support
 */
export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: FieldError | string;
  helper?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  children,
  label,
  error,
  helper,
  required,
  className,
  htmlFor,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const helperId = htmlFor ? `${htmlFor}-helper` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            'block text-sm font-medium',
            hasError ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <div
        className={cn(
          hasError && 'relative' // Allow for error styling
        )}
        aria-describedby={cn(
          hasError && errorId,
          helper && helperId
        )}
      >
        {children}
      </div>

      {hasError && <FormFieldError error={error} id={errorId} />}
      {helper && !hasError && (
        <FormFieldHelper id={helperId}>{helper}</FormFieldHelper>
      )}
    </div>
  );
}

/**
 * Form Summary Errors (displays all errors at top of form)
 */
export interface FormErrorSummaryProps {
  errors: Record<string, FieldError | undefined>;
  className?: string;
}

export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(
    ([_, error]) => error?.message
  );

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'p-4 rounded-md border border-destructive bg-destructive/10',
        'animate-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-destructive mb-2">
            {errorEntries.length === 1
              ? 'There is 1 error with your submission'
              : `There are ${errorEntries.length} errors with your submission`}
          </h3>
          <ul className="space-y-1 text-sm text-destructive">
            {errorEntries.map(([field, error]) => (
              <li key={field} className="flex items-start gap-2">
                <span className="font-medium">{field}:</span>
                <span>{error?.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
