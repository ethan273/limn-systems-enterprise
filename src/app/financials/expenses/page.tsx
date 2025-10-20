"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, AlertTriangle, RefreshCw, Search, X } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  const router = useRouter();
  const { user: _user } = useAuth();

  // Filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [approvalStatus, setApprovalStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, error } = api.expenses.getAll.useQuery(
    {
      search: search || undefined,
      category: category || undefined,
      approval_status: approvalStatus || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 100,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const utils = api.useUtils();
  const expenses = data?.items || [];

  // Get unique categories for filter dropdown
  const { data: categoriesData } = api.expenses.getCategories.useQuery(undefined, {
    enabled: true,
  });
  const categories = categoriesData || [];

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setApprovalStatus("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = search || category || approvalStatus || dateFrom || dateTo;

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
        <Button
          onClick={() => router.push('/financials/expenses/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={approvalStatus} onValueChange={setApprovalStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            {/* Date To */}
            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

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
