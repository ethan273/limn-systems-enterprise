'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  Mail,
  Building,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Shield,
  Layout,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';

// Module configurations per portal type
const PORTAL_MODULES = {
  customer: [
    { id: 'orders', label: 'Orders', description: 'View and manage orders' },
    { id: 'documents', label: 'Documents', description: 'Access documents and files' },
    { id: 'financials', label: 'Financials', description: 'View invoices and payments' },
    { id: 'shipping', label: 'Shipping', description: 'Track shipments' },
    { id: 'profile', label: 'Profile', description: 'Manage profile settings' },
  ],
  designer: [
    { id: 'projects', label: 'Projects', description: 'View and manage projects' },
    { id: 'submissions', label: 'Submissions', description: 'Submit and track designs' },
    { id: 'documents', label: 'Documents', description: 'Access design files' },
    { id: 'quality', label: 'Quality', description: 'Quality control and feedback' },
    { id: 'settings', label: 'Settings', description: 'Portal settings' },
  ],
  factory: [
    { id: 'orders', label: 'Orders', description: 'View production orders' },
    { id: 'quality', label: 'Quality', description: 'Quality inspections' },
    { id: 'shipping', label: 'Shipping', description: 'Shipping management' },
    { id: 'documents', label: 'Documents', description: 'Access production docs' },
    { id: 'settings', label: 'Settings', description: 'Portal settings' },
  ],
  qc: [
    { id: 'inspections', label: 'Inspections', description: 'Conduct quality inspections' },
    { id: 'history', label: 'History', description: 'View inspection history' },
    { id: 'upload', label: 'Upload', description: 'Upload inspection photos/docs' },
    { id: 'documents', label: 'Documents', description: 'Access QC documents' },
    { id: 'settings', label: 'Settings', description: 'Portal settings' },
  ],
} as const;

type PortalType = keyof typeof PORTAL_MODULES;

export default function AdminApprovalDashboard() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'deny' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Portal access configuration state
  const [selectedPortalType, setSelectedPortalType] = useState<PortalType>('customer');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [linkedOrganizationId, setLinkedOrganizationId] = useState('');
  const [organizationType, setOrganizationType] = useState<'customer' | 'partner'>('customer');

  // tRPC queries and mutations
  const { data: requestsData, isLoading, refetch } = api.auth.getPendingRequests.useQuery({
    status: 'pending',
    limit: 50,
  });

  const reviewMutation = api.auth.reviewRequest.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const requests = requestsData?.requests || [];

  const handleAction = (requestId: string, action: 'approve' | 'deny') => {
    setSelectedRequestId(requestId);
    setSelectedAction(action);

    // Pre-select customer portal with all modules for approval
    if (action === 'approve') {
      setSelectedPortalType('customer');
      setSelectedModules(PORTAL_MODULES.customer.map(m => m.id));
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleAllModules = (portalType: PortalType) => {
    const allModules = PORTAL_MODULES[portalType].map(m => m.id);
    if (selectedModules.length === allModules.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(allModules);
    }
  };

  const confirmAction = async () => {
    if (!selectedRequestId || !selectedAction) return;

    // Validate approval requires portal configuration
    if (selectedAction === 'approve' && selectedModules.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one module for portal access',
        variant: 'destructive',
      });
      return;
    }

    await reviewMutation.mutateAsync({
      requestId: selectedRequestId,
      action: selectedAction,
      adminNotes: adminNotes || undefined,
      approvedPortalType: selectedAction === 'approve' ? selectedPortalType : undefined,
      approvedModules: selectedAction === 'approve' ? selectedModules : undefined,
      linkedOrganizationId: (selectedAction === 'approve' && linkedOrganizationId) ? linkedOrganizationId : undefined,
      organizationType: (selectedAction === 'approve' && linkedOrganizationId) ? organizationType : undefined,
    });
  };

  const cancelAction = () => {
    resetForm();
  };

  const resetForm = () => {
    setSelectedRequestId(null);
    setSelectedAction(null);
    setAdminNotes('');
    setSelectedPortalType('customer');
    setSelectedModules([]);
    setLinkedOrganizationId('');
    setOrganizationType('customer');
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="stats-grid">
          <Card>
            <CardHeader className="card-header-compact">
              <CardTitle className="card-title-sm">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{requests.length}</div>
            </CardContent>
          </Card>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`icon-sm ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Requests Table */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="empty-state">
            <CheckCircle2 className="icon-lg icon-success" aria-hidden="true" />
            <p className="empty-state-title">No Pending Requests</p>
            <p className="empty-state-description">
              All access requests have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Access Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Company</th>
                    <th>User Type</th>
                    <th>Reason</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div>
                          <div className="font-medium">
                            {request.first_name} {request.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="icon-xs" aria-hidden="true" />
                            {request.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        {request.company ? (
                          <div className="flex items-center gap-1">
                            <Building className="icon-sm icon-muted" aria-hidden="true" />
                            <span>{request.company}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        {request.user_type ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                            {request.user_type}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        <div className="max-w-xs">
                          {request.reason_for_access ? (
                            <p className="text-sm line-clamp-2">{request.reason_for_access}</p>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Calendar className="icon-sm icon-muted" aria-hidden="true" />
                          <span className="text-sm">
                            {request.requested_at ? format(new Date(request.requested_at), 'MMM d, yyyy') : '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request.id, 'approve')}
                            disabled={reviewMutation.isPending}
                            className="btn-success"
                          >
                            <Check className="icon-sm" aria-hidden="true" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request.id, 'deny')}
                            disabled={reviewMutation.isPending}
                            className="btn-destructive"
                          >
                            <X className="icon-sm" aria-hidden="true" />
                            Deny
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval/Denial Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && cancelAction()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'approve' ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="icon-lg icon-success" aria-hidden="true" />
                  <span>Approve Access Request</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="icon-lg icon-destructive" aria-hidden="true" />
                  <span>Deny Access Request</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'approve'
                ? 'Configure portal access and send magic link to the user.'
                : 'This will deny the access request. The user will be notified.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* User Info Card */}
              <div className="card p-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm ml-2">
                      {selectedRequest.first_name} {selectedRequest.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm ml-2">{selectedRequest.email}</span>
                  </div>
                  {selectedRequest.company && (
                    <div>
                      <span className="text-sm font-medium">Company:</span>
                      <span className="text-sm ml-2">{selectedRequest.company}</span>
                    </div>
                  )}
                  {selectedRequest.phone && (
                    <div>
                      <span className="text-sm font-medium">Phone:</span>
                      <span className="text-sm ml-2">{selectedRequest.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Portal Access Configuration (only for approval) */}
              {selectedAction === 'approve' && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="icon-sm text-primary" aria-hidden="true" />
                    <h3 className="font-semibold">Portal Access Configuration</h3>
                  </div>

                  {/* Portal Type Selection */}
                  <div className="form-field">
                    <Label htmlFor="portal-type">Portal Type *</Label>
                    <Select
                      value={selectedPortalType}
                      onValueChange={(value) => {
                        setSelectedPortalType(value as PortalType);
                        // Reset modules when changing portal type
                        setSelectedModules(PORTAL_MODULES[value as PortalType].map(m => m.id));
                      }}
                    >
                      <SelectTrigger id="portal-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer Portal</SelectItem>
                        <SelectItem value="designer">Designer Portal</SelectItem>
                        <SelectItem value="factory">Factory Portal</SelectItem>
                        <SelectItem value="qc">QC Portal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Module Selection */}
                  <div className="form-field">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Allowed Modules *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllModules(selectedPortalType)}
                      >
                        <Layout className="icon-xs mr-1" />
                        {selectedModules.length === PORTAL_MODULES[selectedPortalType].length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-3 border rounded-md">
                      {PORTAL_MODULES[selectedPortalType].map((module) => (
                        <div key={module.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`module-${module.id}`}
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`module-${module.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {module.label}
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedModules.length === 0 && (
                      <p className="text-sm text-destructive mt-1">
                        At least one module must be selected
                      </p>
                    )}
                  </div>

                  {/* Organization Linking (Optional) */}
                  <div className="form-field">
                    <Label htmlFor="org-type">Link to Organization (Optional)</Label>
                    <div className="flex gap-2">
                      <Select
                        value={organizationType}
                        onValueChange={(value) => setOrganizationType(value as 'customer' | 'partner')}
                      >
                        <SelectTrigger id="org-type" className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                        </SelectContent>
                      </Select>
                      <input
                        type="text"
                        placeholder="Organization ID (UUID)"
                        value={linkedOrganizationId}
                        onChange={(e) => setLinkedOrganizationId(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Link this user to a specific customer or partner organization
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="form-field">
                <label htmlFor="reviewer-notes" className="form-label">
                  <MessageSquare className="icon-sm" aria-hidden="true" />
                  Admin Notes (Optional)
                </label>
                <Textarea
                  id="reviewer-notes"
                  placeholder="Add internal notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelAction} disabled={reviewMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={reviewMutation.isPending || (selectedAction === 'approve' && selectedModules.length === 0)}
              className={selectedAction === 'approve' ? 'btn-success' : 'btn-destructive'}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                  Processing...
                </>
              ) : selectedAction === 'approve' ? (
                <>
                  <Check className="icon-sm" aria-hidden="true" />
                  Approve & Send Magic Link
                </>
              ) : (
                <>
                  <X className="icon-sm" aria-hidden="true" />
                  Deny Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
