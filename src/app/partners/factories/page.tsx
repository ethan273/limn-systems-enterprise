'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Building2, Plus, MapPin, Phone, Mail, Star } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";
import { Badge } from '@/components/ui/badge';

/**
 * Factory Directory Page
 * Lists all factory partners with filtering and search
 */
export default function FactoriesPage() {
  const router = useRouter();
  const [search, _setSearch] = useState('');
  const [statusFilter, _setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_approval' | 'suspended'>('active');

  // Fetch factories
  const { data, isLoading } = api.partners.getAll.useQuery({
    type: 'factory',
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim(),
    limit: 50,
  });

  const factories = data?.partners || [];

  const handleCreateFactory = () => {
    router.push('/partners/factories/new');
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const avgQualityRating = factories.length > 0
    ? (
      factories.reduce((sum: number, f: { quality_rating: number | null }) =>
        sum + (f.quality_rating ? Number(f.quality_rating) : 0), 0
      ) / factories.filter((f: { quality_rating: number | null }) => f.quality_rating).length
    ).toFixed(1)
    : '—';

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Factories',
      value: data?.total || 0,
      description: 'All factory partners',
      icon: Building2,
      iconColor: 'info',
    },
    {
      title: 'Active',
      value: factories.filter((f: { status: string }) => f.status === 'active').length,
      description: 'Active factories',
      icon: Building2,
      iconColor: 'success',
    },
    {
      title: 'Pending Approval',
      value: factories.filter((f: { status: string }) => f.status === 'pending_approval').length,
      description: 'Awaiting approval',
      icon: Building2,
      iconColor: 'warning',
    },
    {
      title: 'Avg Quality Rating',
      value: avgQualityRating,
      description: 'Average rating',
      icon: Star,
      iconColor: 'info',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'company_name',
      label: 'Company Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value as string}</div>
          <div className="text-sm text-muted flex items-center gap-1">
            <Mail className="icon-xs" aria-hidden="true" />
            {row.primary_email}
          </div>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Location',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <MapPin className="icon-xs text-muted" aria-hidden="true" />
          {row.city}, {row.country}
        </div>
      ),
    },
    {
      key: 'primary_contact',
      label: 'Primary Contact',
      render: (value, row) => (
        <div>
          <div>{value as string}</div>
          <div className="text-sm text-muted flex items-center gap-1">
            <Phone className="icon-xs" aria-hidden="true" />
            {row.primary_phone}
          </div>
        </div>
      ),
    },
    {
      key: 'specializations',
      label: 'Specializations',
      render: (value) => {
        const specs = value as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {specs.slice(0, 2).map((spec: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
            {specs.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{specs.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'quality_rating',
      label: 'Quality Rating',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted">—</span>;
        return (
          <div className="flex items-center gap-1">
            <Star className="icon-xs text-warning" aria-hidden="true" />
            <span className="font-medium">{Number(value).toFixed(1)}</span>
            <span className="text-muted">/ 5.0</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {formatStatus(value as string)}
        </Badge>
      ),
    },
    {
      key: '_count',
      label: 'Orders',
      render: (value) => {
        const count = (value as any)?.production_orders || 0;
        return (
          <div>
            <div className="font-medium">{count}</div>
            <div className="text-xs text-muted">orders</div>
          </div>
        );
      },
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search factories',
      type: 'search',
      placeholder: 'Search by name, city, country...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending_approval', label: 'Pending Approval' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Factory Partners"
        subtitle="Manage your manufacturing partners and production facilities"
        actions={[
          {
            label: 'Add Factory',
            icon: Plus,
            onClick: handleCreateFactory,
          },
        ]}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Factories DataTable */}
      {isLoading ? (
        <LoadingState message="Loading factories..." size="lg" />
      ) : !factories || factories.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No factories found"
          description={search ? 'Try adjusting your search or filters' : 'Get started by adding your first factory partner'}
          action={!search ? {
            label: 'Add Factory',
            onClick: handleCreateFactory,
            icon: Plus,
          } : undefined}
        />
      ) : (
        <DataTable
          data={factories}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/partners/factories/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Building2,
            title: 'No factories match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
