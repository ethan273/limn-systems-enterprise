"use client";

import { useRouter } from "next/navigation";
// Auth is handled by middleware - no client-side checks needed
import { api } from "@/lib/api/client";
import { LoadingState, PageHeader, EmptyState } from "@/components/common";
import { FileText, DollarSign, TrendingUp, Download, AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";

export const dynamic = 'force-dynamic';

export default function FinancialReportsPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch invoices for reporting
  const { data: invoicesData, isLoading: isLoadingInvoices, error: invoicesError } = api.invoices.getAll.useQuery(
    {
      limit: 1000,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  // Fetch payments for reporting
  const { data: paymentsData, isLoading: isLoadingPayments, error: paymentsError } = api.payments.getAll.useQuery(
    {
      limit: 1000,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  // Fetch expenses stats
  const { data: expensesStats, isLoading: isLoadingExpenses, error: expensesError } = api.expenses.getStats.useQuery(
    {
      dateFrom,
      dateTo,
    },
    {
      enabled: true,
    }
  );

  const utils = api.useUtils();

  // Handle query errors
  const error = invoicesError || paymentsError || expensesError;
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Financial Reports"
          subtitle="Revenue, expenses, and financial summaries"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load financial reports"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              utils.invoices.getAll.invalidate();
              utils.payments.getAll.invalidate();
              utils.expenses.getStats.invalidate();
            },
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoadingInvoices || isLoadingPayments || isLoadingExpenses) {
    return (
      <div className="page-container">
        <LoadingState message="Loading financial reports..." size="lg" />
      </div>
    );
  }

  const invoices = invoicesData?.items || [];
  const payments = paymentsData?.items || [];

  // Calculate summary statistics
  const totalInvoiceAmount = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum: number, pay: any) => sum + Number(pay.amount_received || 0), 0);
  const totalExpenses = expensesStats?.totalAmount || 0;
  const netRevenue = totalInvoiceAmount - totalExpenses;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Financial Reports</h1>
          <p className="text-tertiary">Revenue, expenses, and financial summaries</p>
        </div>
        <button
          onClick={() => alert('Export functionality coming soon')}
          className="btn btn-primary"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-muted rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-tertiary">Total Invoices</p>
              <p className="text-2xl font-semibold">${totalInvoiceAmount.toLocaleString()}</p>
              <p className="text-xs text-tertiary">{invoices.length} invoices</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success-muted rounded-lg">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-tertiary">Payments Received</p>
              <p className="text-2xl font-semibold">${totalPaymentsReceived.toLocaleString()}</p>
              <p className="text-xs text-tertiary">{payments.length} payments</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive-muted rounded-lg">
              <DollarSign className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-tertiary">Total Expenses</p>
              <p className="text-2xl font-semibold">${totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-tertiary">{expensesStats?.totalExpenses || 0} expenses</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${netRevenue >= 0 ? 'bg-success-muted' : 'bg-warning-muted'}`}>
              <TrendingUp className={`w-6 h-6 ${netRevenue >= 0 ? 'text-success' : 'text-warning'}`} />
            </div>
            <div>
              <p className="text-sm text-tertiary">Net Revenue</p>
              <p className={`text-2xl font-semibold ${netRevenue >= 0 ? 'text-success' : 'text-warning'}`}>
                ${netRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-tertiary">
                {netRevenue >= 0 ? 'Profitable' : 'Loss'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Status Breakdown */}
      <div className="card mb-4">
        <h3 className="text-lg font-semibold mb-4">Invoice Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['draft', 'sent', 'paid', 'overdue'].map((status) => {
            const count = invoices.filter((inv: any) => inv.status === status).length;
            const amount = invoices
              .filter((inv: any) => inv.status === status)
              .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

            return (
              <div key={status} className="p-4 border rounded-lg">
                <p className="text-sm text-tertiary mb-1 capitalize">{status}</p>
                <p className="text-xl font-semibold">{count}</p>
                <p className="text-sm text-tertiary">${amount.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense Breakdown */}
      {expensesStats && expensesStats.byCategory && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Expense Breakdown by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(expensesStats.byCategory).map(([category, data]: [string, any]) => (
              <div key={category} className="p-4 border rounded-lg">
                <p className="text-sm font-medium mb-1 capitalize">{category}</p>
                <p className="text-xl font-semibold">${data.total.toLocaleString()}</p>
                <p className="text-sm text-tertiary">{data.count} expenses</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/financials/invoices')}
            className="btn btn-outline"
          >
            View All Invoices
          </button>
          <button
            onClick={() => router.push('/financials/payments')}
            className="btn btn-outline"
          >
            View All Payments
          </button>
          <button
            onClick={() => router.push('/financials/expenses')}
            className="btn btn-outline"
          >
            View All Expenses
          </button>
        </div>
      </div>
    </div>
  );
}
