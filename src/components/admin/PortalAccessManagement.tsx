'use client';

/**
 * Portal Access Management Component
 * Admin interface for managing user portal access post-approval
 *
 * Features:
 * - List all portal users with filtering
 * - View/edit user access details
 * - Update modules and portal types
 * - Revoke and reactivate access
 * - Add new portal access
 * - Pagination support
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Edit,
  Ban,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type PortalType = 'customer' | 'designer' | 'factory' | 'qc';

// Module definitions for each portal type
const PORTAL_MODULES: Record<PortalType, Array<{ id: string; label: string; description: string }>> = {
  customer: [
    { id: 'orders', label: 'Orders', description: 'View and manage orders' },
    { id: 'documents', label: 'Documents', description: 'Access documents and files' },
    { id: 'financials', label: 'Financials', description: 'View invoices and payments' },
    { id: 'shipping', label: 'Shipping', description: 'Track shipments' },
    { id: 'profile', label: 'Profile', description: 'Manage profile settings' },
  ],
  designer: [
    { id: 'projects', label: 'Projects', description: 'Manage design projects' },
    { id: 'submissions', label: 'Submissions', description: 'Submit designs for review' },
    { id: 'documents', label: 'Documents', description: 'Access project documents' },
    { id: 'quality', label: 'Quality', description: 'Quality control and feedback' },
    { id: 'settings', label: 'Settings', description: 'Account settings' },
  ],
  factory: [
    { id: 'orders', label: 'Orders', description: 'View production orders' },
    { id: 'quality', label: 'Quality', description: 'QC inspections and reports' },
    { id: 'shipping', label: 'Shipping', description: 'Shipping and logistics' },
    { id: 'documents', label: 'Documents', description: 'Technical documents' },
    { id: 'settings', label: 'Settings', description: 'Account settings' },
  ],
  qc: [
    { id: 'inspections', label: 'Inspections', description: 'Perform quality inspections' },
    { id: 'history', label: 'History', description: 'View inspection history' },
    { id: 'upload', label: 'Upload', description: 'Upload inspection photos' },
    { id: 'documents', label: 'Documents', description: 'Access QC documents' },
    { id: 'settings', label: 'Settings', description: 'Account settings' },
  ],
};

export default function PortalAccessManagement() {
  const { toast } = useToast();
  const utils = api.useUtils();

  // Filter state
  const [portalTypeFilter, setPortalTypeFilter] = useState<'all' | PortalType>('all');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedAccessId, setSelectedAccessId] = useState<string | null>(null);
  const [selectedPortalType, setSelectedPortalType] = useState<PortalType>('customer');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Fetch portal users
  const { data: portalUsers, isLoading } = api.portalAccessAdmin.getAllPortalUsers.useQuery({
    portalType: portalTypeFilter,
    isActive: activeFilter,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  // Mutations
  const updateAccessMutation = api.portalAccessAdmin.updatePortalAccess.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Portal access updated successfully',
      });
      utils.portalAccessAdmin.getAllPortalUsers.invalidate();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revokeAccessMutation = api.portalAccessAdmin.revokePortalAccess.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Portal access revoked successfully',
      });
      utils.portalAccessAdmin.getAllPortalUsers.invalidate();
      setRevokeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const reactivateAccessMutation = api.portalAccessAdmin.reactivatePortalAccess.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Portal access reactivated successfully',
      });
      utils.portalAccessAdmin.getAllPortalUsers.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle edit button click
  const handleEdit = (record: any) => {
    setSelectedAccessId(record.id);
    setSelectedPortalType(record.portalType as PortalType);
    setSelectedModules(record.allowedModules);
    setEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedAccessId) return;

    if (selectedModules.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one module',
        variant: 'destructive',
      });
      return;
    }

    await updateAccessMutation.mutateAsync({
      accessId: selectedAccessId,
      allowedModules: selectedModules,
      portalType: selectedPortalType,
    });
  };

  // Handle revoke
  const handleRevoke = (accessId: string) => {
    setSelectedAccessId(accessId);
    setRevokeDialogOpen(true);
  };

  const confirmRevoke = async () => {
    if (!selectedAccessId) return;

    await revokeAccessMutation.mutateAsync({
      accessId: selectedAccessId,
      reason: 'Revoked by admin',
    });
  };

  // Handle reactivate
  const handleReactivate = async (accessId: string) => {
    await reactivateAccessMutation.mutateAsync({
      accessId,
    });
  };

  // Toggle module selection
  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Select all / deselect all
  const handleSelectAll = () => {
    const allModuleIds = PORTAL_MODULES[selectedPortalType].map(m => m.id);
    setSelectedModules(allModuleIds);
  };

  const handleDeselectAll = () => {
    setSelectedModules([]);
  };

  // Format portal type for display
  const formatPortalType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="portalType">Portal Type</Label>
          <Select
            value={portalTypeFilter}
            onValueChange={(value) => {
              setPortalTypeFilter(value as 'all' | PortalType);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger id="portalType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Portals</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
              <SelectItem value="factory">Factory</SelectItem>
              <SelectItem value="qc">QC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label htmlFor="status">Status</Label>
          <Select
            value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
            onValueChange={(value) => {
              setActiveFilter(value === 'all' ? undefined : value === 'active');
              setCurrentPage(0);
            }}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => { setPortalTypeFilter('all'); setActiveFilter(undefined); setCurrentPage(0); }}>
          Clear Filters
        </Button>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !portalUsers?.accessRecords || portalUsers.accessRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No portal users found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Portal Type</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Last Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portalUsers.accessRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatPortalType(record.portalType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {record.allowedModules.slice(0, 3).map((module) => (
                          <Badge key={module} variant="secondary" className="text-xs">
                            {module}
                          </Badge>
                        ))}
                        {record.allowedModules.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{record.allowedModules.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.customerName || record.partnerName || '—'}
                    </TableCell>
                    <TableCell>
                      {record.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.grantedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.lastAccessedAt
                        ? new Date(record.lastAccessedAt).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                          disabled={updateAccessMutation.isPending}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {record.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(record.id)}
                            disabled={revokeAccessMutation.isPending}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivate(record.id)}
                            disabled={reactivateAccessMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {portalUsers.total > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, portalUsers.total)} of {portalUsers.total} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!portalUsers.hasMore}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Portal Access</DialogTitle>
            <DialogDescription>
              Update portal type and module permissions for this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Portal Type Selection */}
            <div>
              <Label htmlFor="editPortalType">Portal Type</Label>
              <Select
                value={selectedPortalType}
                onValueChange={(value) => {
                  setSelectedPortalType(value as PortalType);
                  setSelectedModules([]); // Reset modules when portal type changes
                }}
              >
                <SelectTrigger id="editPortalType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="factory">Factory</SelectItem>
                  <SelectItem value="qc">QC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Module Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Allowed Modules</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border rounded-lg p-4">
                {PORTAL_MODULES[selectedPortalType].map((module) => (
                  <div key={module.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`edit-module-${module.id}`}
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`edit-module-${module.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {module.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedModules.length === 0 && (
                <p className="text-xs text-destructive mt-1">At least one module is required</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateAccessMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateAccessMutation.isPending || selectedModules.length === 0}
            >
              {updateAccessMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Portal Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this user&apos;s portal access? They will no longer be able to access this portal.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={revokeAccessMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRevoke}
              disabled={revokeAccessMutation.isPending}
            >
              {revokeAccessMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
