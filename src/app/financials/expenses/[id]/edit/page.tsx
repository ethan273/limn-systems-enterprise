"use client";

import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    vendor: '',
    payment_method: '',
    reference_number: '',
    expense_date: '',
  });

  const { data: expense, isLoading, error } = api.expenses.getById.useQuery(
    { id: expenseId },
    { enabled: !!expenseId }
  );

  const utils = api.useUtils();

  // Populate form when expense loads
  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || '',
        subcategory: expense.subcategory || '',
        amount: expense.amount ? expense.amount.toString() : '',
        description: expense.description || '',
        vendor: expense.vendor || '',
        payment_method: expense.payment_method || '',
        reference_number: expense.reference_number || '',
        expense_date: expense.expense_date
          ? new Date(expense.expense_date).toISOString().split('T')[0]
          : '',
      });
    }
  }, [expense]);

  const updateExpense = api.expenses.update.useMutation({
    onSuccess: () => {
      void utils.expenses.getById.invalidate({ id: expenseId });
      void utils.expenses.getAll.invalidate();
      router.push(`/financials/expenses/${expenseId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateExpense.mutate({
      id: expenseId,
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

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
          <h1>Edit Expense</h1>
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
        <div className="page-header">
          <h1>Edit Expense</h1>
        </div>
        <div className="error-state">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" aria-hidden="true" />
          <h3>Expense Not Found</h3>
          <p className="text-tertiary">The expense you're trying to edit doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => router.push('/financials/expenses')}
            className="btn btn-primary mt-4"
          >
            Back to Expenses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Edit Expense</h1>
        <p className="text-tertiary">{expense.category}</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>Expense Date *</label>
            <input
              type="date"
              required
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Category *</label>
            <input
              type="text"
              required
              placeholder="e.g., Office Supplies, Travel, Equipment"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Subcategory</label>
            <input
              type="text"
              placeholder="Optional"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Amount *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Vendor</label>
            <input
              type="text"
              placeholder="Vendor name"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Payment Method</label>
            <input
              type="text"
              placeholder="e.g., Credit Card, Cash, Check"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Reference Number</label>
            <input
              type="text"
              placeholder="Receipt or invoice number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </div>

          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="Expense description or notes"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
            <button
              type="button"
              onClick={() => router.push(`/financials/expenses/${expenseId}`)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateExpense.isPending}
              className="btn btn-primary"
            >
              {updateExpense.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
