'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Palette, Plus, MapPin, Phone, Mail, Star, AlertTriangle, RefreshCw } from 'lucide-react';
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
 * Designer Directory Page
 * Lists all designer partners with filtering and search
 */
export default function DesignersPage() {
  const router = useRouter();
  const [search, _setSearch] = useState('');
  const [statusFilter, _setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_approval' | 'suspended'>('active');
  const utils = api.useUtils();

  // Fetch designers
  const { data, isLoading, error } = api.partners.getAll.useQuery({
    type: 'designer',
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim(),
    limit: 50,
  });

  const designers = data?.partners || [];

  const handleCreateDesigner = () => {
    router.push('/partners/designers/new');
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const avgQualityRating = designers.length > 0
    ? (
      designers.reduce((sum: number, d: { quality_rating: number | null }) =>
        sum + (d.quality_rating ? Number(d.quality_rating) : 0), 0
      ) / designers.filter((d: { quality_rating: number | null }) => d.quality_rating).length
    ).toFixed(1)
    : '—';

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Designers',
      value: data?.total || 0,
      description: 'All designer partners',
      icon: Palette,
      iconColor: 'info',
    },
    {
      title: 'Active',
      value: designers.filter((d: { status: string }) => d.status === 'active').length,
      description: 'Active designers',
      icon: Palette,
      iconColor: 'success',
    },
    {
      title: 'Pending Approval',
      value: designers.filter((d: { status: string }) => d.status === 'pending_approval').length,
      description: 'Awaiting approval',
      icon: Palette,
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
        const specs = (value as string[]) || [];
        if (specs.length === 0) {
          return <span className="text-muted">—</span>;
        }
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
      label: 'Projects',
      render: (value) => {
        const count = (value as any)?.design_projects || (value as any)?.production_orders || 0;
        return (
          <div>
            <div className="font-medium">{count}</div>
            <div className="text-xs text-muted">projects</div>
          </div>
        );
      },
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search designers',
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

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Designer Partners"
          subtitle="Manage your design partners and creative professionals"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load designers"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.partners.getAll.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Designer Partners"
        subtitle="Manage your design partners and creative professionals"
        actions={[
          {
            label: 'Add Designer',
            icon: Plus,
            onClick: handleCreateDesigner,
          },
        ]}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Designers DataTable */}
      {isLoading ? (
        <LoadingState message="Loading designers..." size="lg" />
      ) : !designers || designers.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="No designers found"
          description={search ? 'Try adjusting your search or filters' : 'Get started by adding your first designer partner'}
          action={!search ? {
            label: 'Add Designer',
            onClick: handleCreateDesigner,
            icon: Plus,
          } : undefined}
        />
      ) : (
        <DataTable
          data={designers}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/partners/designers/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Palette,
            title: 'No designers match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
