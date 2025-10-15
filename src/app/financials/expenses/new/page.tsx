"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useState } from "react";

export default function NewExpensePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    vendor: '',
    payment_method: '',
    reference_number: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const createExpense = api.expenses.create.useMutation({
    onSuccess: () => {
      router.push('/financials/expenses');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Add New Expense</h1>
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
              onClick={() => router.push('/financials/expenses')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExpense.isPending}
              className="btn btn-primary"
            >
              {createExpense.isPending ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
