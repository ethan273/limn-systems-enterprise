"use client";

import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { format } from "date-fns";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const { data: expense, isLoading, error } = api.expenses.getById.useQuery(
    { id: expenseId },
    { enabled: !!expenseId }
  );

  const utils = api.useUtils();

  const deleteExpense = api.expenses.delete.useMutation({
    onSuccess: () => {
      router.push('/financials/expenses');
    },
  });

  const updateStatus = api.expenses.updateApprovalStatus.useMutation();

  if (isLoading) {
    return (
      <div className="page-container">
        <p>Loading expense details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Expense Details</h1>
        </div>
        <div className="error-state">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" aria-hidden="true" />
          <h3>Failed to Load Expense</h3>
          <p className="text-tertiary">{error.message}</p>
          <button
            onClick={() => void utils.expenses.getById.invalidate()}
            className="btn btn-primary mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="page-container">
        <p>Expense not found</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Expense Details</h1>
          <p className="text-tertiary">{expense.category}</p>
        </div>
        <div className="flex gap-2">
          {expense.approval_status === 'pending' && (
            <>
              <button
                onClick={() => updateStatus.mutate({ id: expenseId, approval_status: 'approved' })}
                className="btn btn-success"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: expenseId, approval_status: 'rejected' })}
                className="btn btn-outline"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => {
              if (confirm('Delete this expense?')) {
                deleteExpense.mutate({ id: expenseId });
              }
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="card">
        <div className="detail-grid">
          <div className="detail-row">
            <span className="detail-label">Expense Date:</span>
            <span className="detail-value">{format(new Date(expense.expense_date), "MMM d, yyyy")}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value font-medium text-lg">${Number(expense.amount).toLocaleString()}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Category:</span>
            <span className="detail-value">{expense.category}</span>
          </div>

          {expense.subcategory && (
            <div className="detail-row">
              <span className="detail-label">Subcategory:</span>
              <span className="detail-value">{expense.subcategory}</span>
            </div>
          )}

          {expense.vendor && (
            <div className="detail-row">
              <span className="detail-label">Vendor:</span>
              <span className="detail-value">{expense.vendor}</span>
            </div>
          )}

          {expense.payment_method && (
            <div className="detail-row">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">{expense.payment_method}</span>
            </div>
          )}

          {expense.reference_number && (
            <div className="detail-row">
              <span className="detail-label">Reference Number:</span>
              <span className="detail-value">{expense.reference_number}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`status-badge status-${expense.approval_status}`}>
              {expense.approval_status}
            </span>
          </div>

          {expense.description && (
            <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
              <span className="detail-label">Description:</span>
              <span className="detail-value">{expense.description}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Created:</span>
            <span className="detail-value text-sm text-tertiary">
              {expense.created_at && format(new Date(expense.created_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>

          {expense.updated_at && expense.updated_at !== expense.created_at && (
            <div className="detail-row">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value text-sm text-tertiary">
                {format(new Date(expense.updated_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
