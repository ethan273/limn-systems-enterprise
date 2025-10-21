'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { PortalAccessDialog } from './PortalAccessDialog';

interface EmployeeManagementProps {
  partnerId: string;
  partnerType: 'factory' | 'designer' | 'sourcing';
}

export function EmployeeManagement({ partnerId, partnerType }: EmployeeManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPortalAccessOpen, setIsPortalAccessOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const utils = api.useUtils();

  // Fetch contacts
  const {
    data: contacts,
    isLoading,
    error,
  } = api.partners.contacts.list.useQuery({
    partner_id: partnerId,
    include_inactive: includeInactive,
  });

  // Delete mutation
  const deleteMutation = api.partners.contacts.delete.useMutation({
    onSuccess: () => {
      utils.partners.contacts.list.invalidate();
      utils.partners.getById.invalidate();
    },
  });

  const handleEdit = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsFormOpen(true);
  };

  const handleDelete = async (contactId: string, contactName: string) => {
    if (confirm(`Are you sure you want to remove ${contactName}? This will revoke their portal access and mark them as terminated.`)) {
      await deleteMutation.mutateAsync({ id: contactId });
    }
  };

  const handleManagePortalAccess = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsPortalAccessOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedContactId(null);
  };

  const handlePortalAccessClose = () => {
    setIsPortalAccessOpen(false);
    setSelectedContactId(null);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load employees"
            description={error.message || "An unexpected error occurred. Please try again."}
            action={{
              label: 'Try Again',
              onClick: () => utils.partners.contacts.list.invalidate(),
              icon: RefreshCw,
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState message="Loading employees..." size="sm" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employee Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeInactive(!includeInactive)}
            >
              {includeInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
            <Button
              onClick={() => {
                setSelectedContactId(null);
                setIsFormOpen(true);
              }}
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role/Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Portal Access</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className={!contact.active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      {contact.name}
                      {contact.is_primary && (
                        <Badge variant="default" className="ml-2 text-xs">Primary</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{contact.role}</span>
                        {/* TODO: Department field not in schema yet */}
                        {/* {contact.department && (
                          <span className="text-xs text-muted-foreground">{contact.department}</span>
                        )} */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a href={`mailto:${contact.email}`} className="text-info hover:underline text-sm">
                        {contact.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {/* TODO: Employment status fields not in schema yet */}
                        <Badge
                          variant={contact.active ? 'default' : 'secondary'}
                          className="text-xs w-fit"
                        >
                          {contact.active ? 'Active' : 'Inactive'}
                        </Badge>
                        {/* {contact.employment_start_date && (
                          <span className="text-xs text-muted-foreground">
                            Since {formatDate(contact.employment_start_date)}
                          </span>
                        )} */}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* TODO: Portal access fields not in schema yet */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Not available</span>
                      </div>
                      {/* {contact.portal_access_enabled ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium">{contact.portal_role}</span>
                            {contact.portal_modules_allowed && contact.portal_modules_allowed.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {contact.portal_modules_allowed.length} modules
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">No access</span>
                        </div>
                      )} */}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {/* TODO: last_login_at field not in schema yet */}
                        —
                        {/* {contact.last_login_at ? formatDate(contact.last_login_at) : '—'} */}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManagePortalAccess(contact.id)}
                          title="Manage Portal Access"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact.id)}
                          title="Edit Employee"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {contact.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id, contact.name)}
                            disabled={deleteMutation.isPending}
                            title="Remove Employee"
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Users}
              title="No Employees"
              description={
                includeInactive
                  ? "No employees have been added yet."
                  : "No active employees. Click 'Show Inactive' to see terminated employees."
              }
              action={{
                label: 'Add First Employee',
                onClick: () => {
                  setSelectedContactId(null);
                  setIsFormOpen(true);
                },
                icon: UserPlus,
              }}
            />
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog
        isOpen={isFormOpen}
        onClose={handleFormClose}
        partnerId={partnerId}
        partnerType={partnerType}
        contactId={selectedContactId}
      />

      <PortalAccessDialog
        isOpen={isPortalAccessOpen}
        onClose={handlePortalAccessClose}
        contactId={selectedContactId}
        partnerType={partnerType}
      />
    </>
  );
}
