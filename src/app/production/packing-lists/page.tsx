"use client";

import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/common";
// Auth is handled by middleware - no client-side checks needed
import { api } from "@/lib/api/client";
import { Package, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export const dynamic = 'force-dynamic';

export default function PackingListsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = api.packing.getAllJobs.useQuery(
    {
      status: statusFilter as any,
      limit: 100,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const jobs = data?.jobs || [];

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Packing Lists</h1>
        </div>
        <div className="card p-8">
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold mb-2">Failed to load packing jobs</h2>
            <p className="text-muted-foreground mb-4">{error.message || "An unexpected error occurred. Please try again."}</p>
            <button
              onClick={() => utils.packing.getAllJobs.invalidate()}
              className="btn btn-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Packing Lists</h1>
        </div>
        <p>Loading packing jobs...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Breadcrumbs
        items={[
          { label: 'Production', href: '/production' },
          { label: 'Packing Lists' }, // Current page
        ]}
      />
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Packing Lists</h1>
          <p className="text-tertiary">Manage packing jobs and shipping preparation</p>
        </div>
        <button
          onClick={() => router.push('/production/orders')}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate from Order
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Status Filter</label>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || undefined)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packing Jobs Table */}
      <div className="card">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <Package className="w-12 h-12 text-tertiary mb-4" />
            <h3>No Packing Jobs Found</h3>
            <p className="text-tertiary">
              Generate packing jobs from production orders to prepare items for shipment.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Order Item</th>
                <th>Quantity</th>
                <th>Boxes</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: any) => (
                <tr
                  key={job.id}
                  onClick={() => router.push(`/production/packing-lists/${job.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <td className="font-mono text-sm">{job.id.split('-')[0]}</td>
                  <td>
                    <div>
                      <div className="font-medium">
                        {job.order_items?.description || 'N/A'}
                      </div>
                      {job.order_items && (
                        <div className="text-sm text-tertiary">
                          Qty: {job.order_items.quantity}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{job.packed_quantity} / {job.quantity}</div>
                      <div className="text-sm text-tertiary">
                        {Math.round((job.packed_quantity / job.quantity) * 100)}%
                      </div>
                    </div>
                  </td>
                  <td>{job.box_count || 0}</td>
                  <td>{job.total_weight ? `${Number(job.total_weight).toFixed(2)} lbs` : '—'}</td>
                  <td>
                    <span className={`status-badge status-${job.packing_status}`}>
                      {job.packing_status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${job.priority}`}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="text-sm">
                    {job.created_at && format(new Date(job.created_at), "MMM d, yyyy")}
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
