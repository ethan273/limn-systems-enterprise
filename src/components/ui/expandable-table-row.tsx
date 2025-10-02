"use client";

import React, { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpandableTableRowProps {
  /** Unique identifier for the row (not used internally, for React key) */
  id?: string;
  /** Content for the main (collapsed) row */
  children: React.ReactNode;
  /** Content to show when expanded */
  expandedContent: React.ReactNode;
  /** Number of columns to span in the expanded row */
  colSpan: number;
  /** Optional className for the main row */
  className?: string;
  /** Optional className for the expanded row */
  expandedClassName?: string;
}

/**
 * ExpandableTableRow - A table row component that can expand to show additional content
 *
 * This component maintains valid HTML table structure by rendering proper <tr> elements
 * instead of wrapping them in divs (which causes hydration errors).
 *
 * Usage:
 * ```tsx
 * <ExpandableTableRow
 *   id={item.id}
 *   colSpan={9}
 *   expandedContent={<div>Expanded content here</div>}
 * >
 *   <TableCell>Column 1</TableCell>
 *   <TableCell>Column 2</TableCell>
 * </ExpandableTableRow>
 * ```
 */
export function ExpandableTableRow({
  id: _id,
  children,
  expandedContent,
  colSpan,
  className = '',
  expandedClassName = '',
}: ExpandableTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Main row - always visible */}
      <TableRow
        className={`cursor-pointer hover:bg-muted/50 ${className}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {children}
      </TableRow>

      {/* Expanded row - only visible when isExpanded is true */}
      {isExpanded && (
        <TableRow className={expandedClassName}>
          <TableCell colSpan={colSpan} className="p-0">
            <div className="px-6 py-4 bg-muted/20 border-t">
              {expandedContent}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

interface ExpandableTableRowWithTriggerProps {
  /** Unique identifier for the row (not used internally, for React key) */
  id?: string;
  /** Content for the main row (excluding the trigger button cell) */
  children: React.ReactNode;
  /** Content to show when expanded */
  expandedContent: React.ReactNode;
  /** Number of columns to span in the expanded row */
  colSpan: number;
  /** Optional className for the main row */
  className?: string;
  /** Optional className for the expanded row */
  expandedClassName?: string;
}

/**
 * ExpandableTableRowWithTrigger - Like ExpandableTableRow but with a built-in chevron trigger button
 *
 * This variant automatically adds a chevron button in the first cell.
 * Your children should NOT include the trigger cell - it's added automatically.
 *
 * Usage:
 * ```tsx
 * <ExpandableTableRowWithTrigger
 *   id={item.id}
 *   colSpan={9}
 *   expandedContent={<div>Expanded content here</div>}
 * >
 *   <TableCell>Column 2</TableCell>
 *   <TableCell>Column 3</TableCell>
 * </ExpandableTableRowWithTrigger>
 * ```
 */
export function ExpandableTableRowWithTrigger({
  id: _id,
  children,
  expandedContent,
  colSpan,
  className = '',
  expandedClassName = '',
}: ExpandableTableRowWithTriggerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Main row with trigger button */}
      <TableRow className={`cursor-pointer hover:bg-muted/50 ${className}`}>
        <TableCell className="w-12">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        {children}
      </TableRow>

      {/* Expanded row */}
      {isExpanded && (
        <TableRow className={expandedClassName}>
          <TableCell colSpan={colSpan} className="p-0">
            <div className="px-6 py-4 bg-muted/20 border-t">
              {expandedContent}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
