'use client';
import { log } from '@/lib/logger';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingState } from '@/components/common/LoadingState';
import { Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface PortalAccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string | null;
  partnerType: 'factory' | 'designer' | 'sourcing';
}

export function PortalAccessDialog({
  isOpen,
  onClose,
  contactId,
  partnerType,
}: PortalAccessDialogProps) {
  const utils = api.useUtils();
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [sendMagicLink, setSendMagicLink] = useState(false);

  // Fetch contact data
  const { data: contact, isLoading: isLoadingContact } = api.partners.contacts.getById.useQuery(
    { id: contactId! },
    { enabled: !!contactId }
  );

  // Fetch available roles for this partner type
  const { data: roles, isLoading: isLoadingRoles } = api.partners.portalRoles.getByPartnerType.useQuery(
    { partner_type: partnerType },
    { enabled: isOpen }
  );

  // Fetch available modules for this partner type
  const { data: modules, isLoading: isLoadingModules } = api.partners.portalRoles.getAvailableModules.useQuery(
    { partner_type: partnerType },
    { enabled: isOpen }
  );

  // Assign portal access mutation
  const assignAccessMutation = api.partners.contacts.assignPortalAccess.useMutation({
    onSuccess: () => {
      utils.partners.contacts.list.invalidate();
      utils.partners.contacts.getById.invalidate();
      onClose();
    },
  });

  // Revoke portal access mutation
  const revokeAccessMutation = api.partners.contacts.revokePortalAccess.useMutation({
    onSuccess: () => {
      utils.partners.contacts.list.invalidate();
      utils.partners.contacts.getById.invalidate();
      onClose();
    },
  });

  // Update form when contact data loads
  useEffect(() => {
    if (contact) {
      setSelectedRole(contact.portal_role || '');
      setSelectedModules(contact.portal_modules_allowed as string[] || []);
    }
  }, [contact]);

  // Auto-select modules when role changes
  useEffect(() => {
    if (selectedRole && roles) {
      const role = roles.find((r) => r.role_key === selectedRole);
      if (role && role.default_modules) {
        setSelectedModules(role.default_modules);
      }
    }
  }, [selectedRole, roles]);

  const handleToggleModule = (moduleKey: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleAssignAccess = async () => {
    if (!contactId || !selectedRole || selectedModules.length === 0) {
      return;
    }

    try {
      await assignAccessMutation.mutateAsync({
        contact_id: contactId,
        portal_role: selectedRole,
        portal_modules: selectedModules,
        send_magic_link: sendMagicLink,
      });
    } catch (error) {
      // Error handled by mutation
      log.error('Failed to assign portal access:', { error });
    }
  };

  const handleRevokeAccess = async () => {
    if (!contactId) return;

    if (confirm('Are you sure you want to revoke portal access for this employee?')) {
      await revokeAccessMutation.mutateAsync({ contact_id: contactId });
    }
  };

  const isLoading = isLoadingContact || isLoadingRoles || isLoadingModules;
  const isSubmitting = assignAccessMutation.isPending || revokeAccessMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Portal Access
            </div>
          </DialogTitle>
          <DialogDescription>
            Grant or revoke portal access for {contact?.name || 'this employee'}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Loading portal settings..." size="sm" />
        ) : (
          <div className="space-y-6">
            {/* Current Status */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {contact?.portal_access_enabled ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">Portal Access Enabled</p>
                        <p className="text-sm text-muted-foreground">
                          Role: {contact.portal_role || 'N/A'} • Last login: {contact.last_login_at ? new Date(contact.last_login_at).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">No Portal Access</p>
                        <p className="text-sm text-muted-foreground">
                          Grant access below to allow this employee to use the portal
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Portal Role *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.role_key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.role_label}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module Selection */}
            <div className="space-y-3">
              <Label>Portal Modules *</Label>
              <p className="text-sm text-muted-foreground">
                Select which modules this employee can access in the portal
              </p>
              <div className="grid grid-cols-2 gap-3">
                {modules?.map((module) => (
                  <div
                    key={module.key}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleToggleModule(module.key)}
                  >
                    <Checkbox
                      id={module.key}
                      checked={selectedModules.includes(module.key)}
                      onCheckedChange={() => handleToggleModule(module.key)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={module.key}
                        className="font-medium cursor-pointer"
                      >
                        {module.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Send Magic Link Option */}
            <div className="flex items-center space-x-2 p-3 bg-info/10 rounded-lg">
              <Checkbox
                id="send_magic_link"
                checked={sendMagicLink}
                onCheckedChange={(checked) => setSendMagicLink(checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="send_magic_link" className="cursor-pointer">
                  Send magic link to employee
                </Label>
                <p className="text-xs text-muted-foreground">
                  Email a login link to {contact?.email}
                </p>
              </div>
            </div>

            {/* Warning for user creation */}
            {!contact?.user_id && (
              <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">User Account Required</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This employee doesn&apos;t have a user account yet. Portal user creation will be implemented soon. For now, please create the user account manually in the authentication system.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t">
              <div>
                {contact?.portal_access_enabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRevokeAccess}
                    disabled={isSubmitting}
                  >
                    Revoke Access
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignAccess}
                  disabled={isSubmitting || !selectedRole || selectedModules.length === 0}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : contact?.portal_access_enabled
                    ? 'Update Access'
                    : 'Grant Access'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
