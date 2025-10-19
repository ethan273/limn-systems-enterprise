"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { DollarSign, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  const router = useRouter();
  const { user: _user } = useAuth();

  const { data, isLoading, error } = api.expenses.getAll.useQuery(
    {
      limit: 100,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const utils = api.useUtils();
  const expenses = data?.items || [];

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
        <button
          onClick={() => router.push('/financials/expenses/new')}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="card">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <DollarSign className="w-12 h-12 text-tertiary mb-4" />
            <h3>No Expenses Found</h3>
            <p className="text-tertiary">Get started by adding your first expense.</p>
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
