"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { Button } from "@/components/ui/button";
import { TableFilters } from "@/components/common";
import { DollarSign, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  const router = useRouter();
  const { user: _user } = useAuth();

  // Unified filter management with new hook
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  } = useTableState({
    initialFilters: {
      search: '',
      category: '',
      approval_status: '',
      dateFrom: '',
      dateTo: '',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Backend query with unified params
  const { data, isLoading, error } = api.expenses.getAll.useQuery({
    ...queryParams,
    approval_status: rawFilters.approval_status || undefined,
  }, {
    enabled: true,
  });

  const utils = api.useUtils();
  const expenses = data?.items || [];

  // Get unique categories for filter dropdown
  const { data: categoriesData } = api.expenses.getCategories.useQuery(undefined, {
    enabled: true,
  });
  const categories = categoriesData || [];

  // Transform categories to SelectOption format
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat: string) => ({ value: cat, label: cat })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Expenses</h1>
        </div>
        <p>Loading expenses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Expenses</h1>
            <p className="text-tertiary">Company expense tracking and approval</p>
          </div>
        </div>
        <div className="error-state">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" aria-hidden="true" />
          <h3>Failed to Load Expenses</h3>
          <p className="text-tertiary">{error.message}</p>
          <button
            onClick={() => void utils.expenses.getAll.invalidate()}
            className="btn btn-primary mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="text-tertiary">Company expense tracking and approval</p>
        </div>
        <Button onClick={() => router.push('/financials/expenses/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search expenses..."
        />

        {/* Category Filter */}
        <TableFilters.Select
          value={rawFilters.category}
          onChange={(value) => setFilter('category', value)}
          options={categoryOptions}
          placeholder="All Categories"
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.approval_status}
          onChange={(value) => setFilter('approval_status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />

        {/* Date Range - Spans 2 columns */}
        <div className="col-span-2">
          <TableFilters.DateRange
            fromValue={rawFilters.dateFrom}
            toValue={rawFilters.dateTo}
            onFromChange={(value) => setFilter('dateFrom', value)}
            onToChange={(value) => setFilter('dateTo', value)}
          />
        </div>
      </TableFilters.Bar>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {data?.total ? `${data.total} expense${data.total === 1 ? '' : 's'} found` : 'No expenses found'}
      </div>

      {/* Expenses Table */}
      <div className="card">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <DollarSign className="w-12 h-12 text-tertiary mb-4" />
            <h3>No Expenses Found</h3>
            <p className="text-tertiary">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "Get started by adding your first expense."}
            </p>
          </div>
        ) : (
          <table className="data-table" data-testid="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense: any) => (
                <tr
                  key={expense.id}
                  onClick={() => router.push(`/financials/expenses/${expense.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <td>{format(new Date(expense.expense_date), "MMM d, yyyy")}</td>
                  <td>
                    <div>
                      <div className="font-medium">{expense.category}</div>
                      {expense.subcategory && (
                        <div className="text-sm text-tertiary">{expense.subcategory}</div>
                      )}
                    </div>
                  </td>
                  <td>{expense.vendor || '—'}</td>
                  <td className="text-sm">{expense.description || '—'}</td>
                  <td className="font-medium">${Number(expense.amount).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${expense.approval_status || 'pending'}`}>
                      {expense.approval_status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
