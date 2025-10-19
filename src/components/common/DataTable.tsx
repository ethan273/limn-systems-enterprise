'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Type definitions
export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'currency' | 'date' | 'custom';
  render?: (_value: unknown, _row: T) => React.ReactNode;
  badgeVariant?: (_value: unknown) => string;
  mobileHidden?: boolean; // Hide column on mobile (< 768px)
  priority?: 'high' | 'medium' | 'low'; // Column priority for responsive display
}

export interface DataTableFilter {
  key: string;
  label: string;
  type: 'search' | 'select' | 'multi-select' | 'date-range';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface DataTableRowAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (_row: T) => void;
  variant?: 'default' | 'destructive';
  separator?: boolean; // Add separator before this action
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  filters?: DataTableFilter[];
  onRowClick?: (_row: T) => void;
  rowActions?: DataTableRowAction<T>[]; // NEW: Row-level actions (edit, delete, etc.)
  pagination?: {
    pageSize?: number;
    showSizeSelector?: boolean;
  };
  emptyState?: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  };
  isLoading?: boolean;
}

// Helper function to format values based on type
function formatValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
        : String(value);
    case 'date':
      return value instanceof Date
        ? value.toLocaleDateString()
        : String(value);
    default:
      return String(value);
  }
}

// Helper function to get nested value from object
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      // eslint-disable-next-line security/detect-object-injection
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  filters = [],
  onRowClick,
  rowActions,
  pagination = { pageSize: 10, showSizeSelector: true },
  emptyState,
  isLoading = false,
}: DataTableProps<T>) {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination.pageSize || 10);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Apply column filters
    // eslint-disable-next-line security/detect-object-injection
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(row => {
          const rowValue = getNestedValue(row, key);
          return String(rowValue) === value;
        });
      }
    });

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortColumn);
        const bValue = getNestedValue(b, sortColumn);

        if (aValue === bValue) return 0;

        const comparison = aValue! < bValue! ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, filterValues, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Render cell content based on column type
  const renderCell = (column: DataTableColumn<T>, row: T) => {
    const value = getNestedValue(row, String(column.key));

    if (column.render) {
      return column.render(value, row);
    }

    if (column.type === 'badge' && column.badgeVariant) {
      const variantClass = column.badgeVariant(value);
      return (
        <span className={`badge ${variantClass}`}>
          {formatValue(value, column.type)}
        </span>
      );
    }

    return formatValue(value, column.type);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
        <h3 className="empty-state-title">Loading...</h3>
      </div>
    );
  }

  // Empty state
  if (filteredAndSortedData.length === 0 && emptyState) {
    const EmptyIcon = emptyState.icon;
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <EmptyIcon className="w-16 h-16" />
        </div>
        <h3 className="empty-state-title">{emptyState.title}</h3>
        {emptyState.description && (
          <p className="empty-state-description">{emptyState.description}</p>
        )}
        {emptyState.action && (
          <Button onClick={emptyState.action.onClick} className="btn-primary">
            {emptyState.action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="data-table-container">
      {/* Filters Section */}
      {filters.length > 0 && (
        <div className="filters-section">
          {filters.map((filter) => {
            if (filter.type === 'search') {
              return (
                <div key={filter.key} className="search-input-wrapper">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={filter.placeholder || 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                    className="search-input"
                    data-testid="data-table-search-input"
                  />
                </div>
              );
            }

            if (filter.type === 'select' && filter.options) {
              return (
                <Select
                  key={filter.key}
                  value={filterValues[filter.key] || 'all'}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger className="filter-select">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Table - Mobile Responsive */}
      <div className="card-content-compact">
        {/* Responsive table wrapper - columns hide on mobile using mobileHidden prop */}
        <div className="w-full">
          <div className="relative">
            <Table data-testid="data-table">
              <TableHeader>
                <TableRow className="table-header">
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className={`table-header-cell ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}
                    >
                      {column.sortable ? (
                        <button
                          onClick={() => handleSort(String(column.key))}
                          className="flex items-center gap-2 hover:text-foreground transition-colors whitespace-nowrap"
                        >
                          {column.label}
                          {sortColumn === String(column.key) ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      ) : (
                        <span className="whitespace-nowrap">{column.label}</span>
                      )}
                    </TableHead>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <TableHead className="table-header-cell w-[70px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow
                    key={row.id as string || Math.random().toString()}
                    className={onRowClick ? 'table-row-clickable' : 'table-row'}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={`table-cell ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}
                        onClick={() => onRowClick?.(row)}
                      >
                        {renderCell(column, row)}
                      </TableCell>
                    ))}
                    {rowActions && rowActions.length > 0 && (
                      <TableCell className="table-cell w-[70px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              data-testid="row-actions-button"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" data-testid="row-actions-menu">
                            {rowActions.map((action, actionIndex) => (
                              <React.Fragment key={actionIndex}>
                                {action.separator && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                  }}
                                  className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
                                  data-testid={`row-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                                  {action.label}
                                </DropdownMenuItem>
                              </React.Fragment>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedData.length)} of{' '}
              {filteredAndSortedData.length} results
            </span>
            {pagination.showSizeSelector && (
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
