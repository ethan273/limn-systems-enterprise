'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api/client';
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Settings,
  Search,
  Filter,
  Trash2,
  Edit,
} from 'lucide-react';
import { PortalModuleConfigDialog } from '@/components/admin/PortalModuleConfigDialog';
import { DataTable, type DataTableColumn } from '@/components/common';
import { toast } from '@/hooks/use-toast';

/**
 * Portal Management Dashboard
 * Admin interface to manage all portal types and users
 * Phase 8: Complete portal access control
 */
export default function PortalManagementPage() {
  const [selectedPortalType, setSelectedPortalType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configPortalType, setConfigPortalType] = useState<'customer' | 'designer' | 'factory' | 'qc'>('customer');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Fetch all portal access records
  const { data: portalUsers, isLoading } = api.admin.roles.getAllPortalUsers.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Update mutation
  const updateMutation = api.admin.roles.updatePortalUser.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portal user updated successfully",
      });
      utils.admin.roles.getAllPortalUsers.invalidate();
      setEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update portal user",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = api.admin.roles.deletePortalUser.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portal user deleted successfully",
      });
      utils.admin.roles.getAllPortalUsers.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete portal user",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      portalRole: editingUser.portal_role,
      isActive: editingUser.is_active,
    });
  };

  const handleDelete = (id: string, email: string) => {
    if (confirm(`Are you sure you want to delete portal access for ${email}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const portalTypes = [
    { value: 'all', label: 'All Portals', count: portalUsers?.length || 0 },
    { value: 'customer', label: 'Customer Portal', count: portalUsers?.filter((u: any) => u.portal_type === 'customer').length || 0 },
    { value: 'designer', label: 'Designer Portal', count: portalUsers?.filter((u: any) => u.portal_type === 'designer').length || 0 },
    { value: 'factory', label: 'Factory Portal', count: portalUsers?.filter((u: any) => u.portal_type === 'factory').length || 0 },
    { value: 'qc', label: 'QC Portal', count: portalUsers?.filter((u: any) => u.portal_type === 'qc').length || 0 },
  ];

  const filteredUsers = portalUsers?.filter((user: any) => {
    const matchesType = selectedPortalType === 'all' || user.portal_type === selectedPortalType;
    const matchesSearch = !searchQuery ||
      user.users_customer_portal_access_user_idTousers?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const getPortalTypeBadge = (type: string) => {
    const badgeClasses: Record<string, string> = {
      customer: 'badge-primary',
      designer: 'badge-secondary',
      factory: 'badge-success',
      qc: 'badge-warning',
    };
    return (
      <Badge className={badgeClasses[type as keyof typeof badgeClasses] || 'badge-neutral'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      admin: 'default',
      editor: 'secondary',
      viewer: 'outline',
    };
    return <Badge variant={variants[role as keyof typeof variants] || 'outline'}>{role}</Badge>;
  };

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'users_customer_portal_access_user_idTousers',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <span className="font-medium">
          {(value as { email?: string | null } | null)?.email || 'N/A'}
        </span>
      ),
    },
    {
      key: 'portal_type',
      label: 'Portal Type',
      render: (value) => getPortalTypeBadge((value as string) || 'customer'),
    },
    {
      key: 'portal_role',
      label: 'Role',
      render: (value) => getRoleBadge((value as string) || 'viewer'),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        value ? (
          <Badge className="badge-active">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        )
      ),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted">
          {value ? new Date(value as string).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_value, row) => (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="icon-sm" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(
              row.id as string,
              (row.users_customer_portal_access_user_idTousers as { email?: string } | null)?.email || 'this user'
            )}
          >
            <Trash2 className="icon-sm icon-destructive" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portal Management</h1>
          <p className="text-muted-foreground">
            Manage access and permissions across all portal types
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Portal User
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{portalUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all portals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {portalUsers?.filter((u: any) => u.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portal Types</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">4</div>
            <p className="text-xs text-muted-foreground mt-1">Customer, Designer, Factory, QC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {portalUsers?.filter((u: any) => u.portal_role === 'admin').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Admin access level</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portal Users</CardTitle>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Portal Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedPortalType} onValueChange={setSelectedPortalType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select portal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {portalTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} ({type.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredUsers}
            columns={columns}
            isLoading={isLoading}
            emptyState={{
              icon: Users,
              title: 'No portal users found',
              description: 'Add portal users to see them here',
            }}
          />
        </CardContent>
      </Card>

      {/* Portal Type Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Portal Type Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['customer', 'designer', 'factory', 'qc'].map((type) => (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {type.charAt(0).toUpperCase() + type.slice(1)} Portal
                    </CardTitle>
                    {getPortalTypeBadge(type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users:</span>
                      <span className="font-medium">
                        {portalUsers?.filter((u: any) => u.portal_type === type).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active:</span>
                      <span className="font-medium">
                        {portalUsers?.filter((u: any) => u.portal_type === type && u.is_active).length || 0}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        setConfigPortalType(type as 'customer' | 'designer' | 'factory' | 'qc');
                        setConfigDialogOpen(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portal Module Configuration Dialog */}
      <PortalModuleConfigDialog
        portalType={configPortalType}
        isOpen={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
      />

      {/* Edit Portal User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portal Access</DialogTitle>
            <DialogDescription>
              Update portal role and status for{' '}
              {editingUser?.users_customer_portal_access_user_idTousers?.email || 'user'}
            </DialogDescription>
          </DialogHeader>
          <div className="form-container">
            <div className="form-field">
              <Label htmlFor="portal-role">Portal Role</Label>
              <Select
                value={editingUser?.portal_role || 'viewer'}
                onValueChange={(value) =>
                  setEditingUser({ ...editingUser, portal_role: value })
                }
              >
                <SelectTrigger id="portal-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <Label htmlFor="is-active">Status</Label>
              <Select
                value={editingUser?.is_active ? 'active' : 'inactive'}
                onValueChange={(value) =>
                  setEditingUser({ ...editingUser, is_active: value === 'active' })
                }
              >
                <SelectTrigger id="is-active">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
