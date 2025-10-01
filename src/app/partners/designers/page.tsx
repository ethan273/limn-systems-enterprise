'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Palette, MapPin, Phone, Mail, Star } from 'lucide-react';

/**
 * Designer Directory Page
 * Lists all designer partners with filtering and search
 */
export default function DesignersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_approval' | 'suspended'>('active');

  // Fetch designers
  const { data, isLoading } = api.partners.getAll.useQuery({
    type: 'designer',
    status: statusFilter,
    search: search.trim(),
    limit: 50,
  });

  const designers = data?.partners || [];

  const handleCreateDesigner = () => {
    router.push('/partners/designers/new');
  };

  const handleViewDesigner = (id: string) => {
    router.push(`/partners/designers/${id}`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending_approval':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Designer Partners</h1>
          <p className="text-muted-foreground mt-1">
            Manage your design partners and creative professionals
          </p>
        </div>
        <Button onClick={handleCreateDesigner}>
          <Plus className="mr-2 h-4 w-4" />
          Add Designer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Designers</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designers.filter((d: { status: string }) => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designers.filter((d: { status: string }) => d.status === 'pending_approval').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designers.length > 0
                ? (
                    designers.reduce((sum: number, d: { quality_rating: number | null }) =>
                      sum + (d.quality_rating ? Number(d.quality_rating) : 0), 0
                    ) / designers.filter((d: { quality_rating: number | null }) => d.quality_rating).length
                  ).toFixed(1)
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search designers by name, city, country..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Designers Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading designers...
            </div>
          ) : designers.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No designers found</h3>
              <p className="text-muted-foreground mt-2">
                {search ? 'Try adjusting your search or filters' : 'Get started by adding your first designer partner'}
              </p>
              {!search && (
                <Button onClick={handleCreateDesigner} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Designer
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Quality Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designers.map((designer: {
                  id: string;
                  company_name: string;
                  city: string;
                  country: string;
                  primary_contact: string;
                  primary_email: string;
                  primary_phone: string;
                  specializations: string[];
                  quality_rating: number | null;
                  status: string;
                  _count: { production_orders: number; design_projects?: number };
                }) => (
                  <TableRow
                    key={designer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDesigner(designer.id)}
                  >
                    <TableCell>
                      <div className="font-medium">{designer.company_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {designer.primary_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                        {designer.city}, {designer.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{designer.primary_contact}</div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {designer.primary_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {designer.specializations.slice(0, 2).map((spec: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {designer.specializations.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{designer.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {designer.quality_rating ? (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{Number(designer.quality_rating).toFixed(1)}</span>
                          <span className="text-muted-foreground ml-1">/ 5.0</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(designer.status)}>
                        {formatStatus(designer.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{designer._count?.design_projects || designer._count?.production_orders || 0}</div>
                      <div className="text-xs text-muted-foreground">projects</div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleViewDesigner(designer.id);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
