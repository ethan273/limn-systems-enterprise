'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react';

interface PortalModuleConfigDialogProps {
  portalType: 'customer' | 'designer' | 'factory' | 'qc';
  isOpen: boolean;
  onClose: () => void;
}

export function PortalModuleConfigDialog({
  portalType,
  isOpen,
  onClose,
}: PortalModuleConfigDialogProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Fetch available modules for this portal type
  const { data: modules, isLoading: modulesLoading } = api.admin.portalModules.getAvailableModules.useQuery({
    portalType,
  });

  // Fetch current settings for selected entity
  const { data: settings, refetch: refetchSettings, isLoading: settingsLoading } = api.admin.portalModules.getSettings.useQuery({
    portalType,
    entityId: selectedEntityId || undefined,
  }, {
    enabled: isOpen, // Only fetch when dialog is open
  });

  // Fetch entities based on portal type
  const { data: customers } = api.admin.portalModules.getCustomers.useQuery(undefined, {
    enabled: isOpen && (portalType === 'customer'),
  });

  const { data: partners } = api.admin.portalModules.getPartners.useQuery(undefined, {
    enabled: isOpen && (portalType === 'designer' || portalType === 'factory' || portalType === 'qc'),
  });

  // Update mutation
  const updateMutation = api.admin.portalModules.updateSettings.useMutation({
    onSuccess: () => {
      setSaveStatus('success');
      refetchSettings();
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1500);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  // Initialize module states when settings load
  useEffect(() => {
    if (settings && modules) {
      const states: Record<string, boolean> = {};

      // Initialize all modules to true by default
      modules.forEach(mod => {
        states[mod.key] = true;
      });

      // Override with actual settings
      // eslint-disable-next-line security/detect-object-injection
      settings.forEach((s) => {
        states[s.moduleKey] = s.isEnabled;
      });

      setModuleStates(states);
    } else if (modules) {
      // No settings exist yet, default all to true
      const states: Record<string, boolean> = {};
      modules.forEach(mod => {
        states[mod.key] = true;
      });
      setModuleStates(states);
    }
  }, [settings, modules]);

  const handleSave = () => {
    setSaveStatus('saving');
    updateMutation.mutate({
      portalType,
      entityId: selectedEntityId || undefined,
      modules: Object.entries(moduleStates).map(([key, enabled]) => ({
        moduleKey: key,
        isEnabled: enabled,
      })),
    });
  };

  const handleClose = () => {
    if (saveStatus !== 'saving') {
      setSelectedEntityId(null);
      setModuleStates({});
      setSaveStatus('idle');
      onClose();
    }
  };

  // Get entity list based on portal type
  const entityList = portalType === 'customer' ? customers : partners;

  const portalTypeLabels = {
    customer: 'Client',
    designer: 'Designer',
    factory: 'Factory',
    qc: 'QC',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dialog-content sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="icon-container icon-primary">
              <Settings2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle>
                {/* eslint-disable-next-line security/detect-object-injection */}
                Configure {portalTypeLabels[portalType]} Portal Modules
              </DialogTitle>
              <DialogDescription>
                Control which modules are visible in the {portalType} portal
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Entity Selector */}
          <div className="space-y-2">
            <Label htmlFor="entity-select">Configure For</Label>
            <Select
              value={selectedEntityId || 'default'}
              onValueChange={(v) => setSelectedEntityId(v === 'default' ? null : v)}
            >
              <SelectTrigger id="entity-select" className="input-field">
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                    Default Settings (All Users)
                  </div>
                </SelectItem>
                {entityList?.map((entity) => {
                  const entityType = 'partner_type' in entity ? String(entity.partner_type || '') : '';
                  return (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center">
                        <span>{entity.company_name}</span>
                        {entityType && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({entityType})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Configure modules for a specific {portalType} or set default settings for all
            </p>
          </div>

          {/* Module Toggles */}
          {modulesLoading || settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Module Visibility</Label>
              <div className="card space-y-3 p-4">
                {modules?.map((mod) => (
                  <div
                    key={mod.key}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <Label htmlFor={`module-${mod.key}`} className="font-medium">
                        {mod.label}
                      </Label>
                      {mod.alwaysVisible && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Required module (always visible)
                        </p>
                      )}
                    </div>
                    {mod.alwaysVisible ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Always On
                      </div>
                    ) : (
                      <Switch
                        id={`module-${mod.key}`}
                        checked={moduleStates[mod.key] ?? true}
                        onCheckedChange={(checked) =>
                          setModuleStates({ ...moduleStates, [mod.key]: checked })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Status Messages */}
          {saveStatus === 'success' && (
            <div className="alert alert-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>Module settings saved successfully!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="alert alert-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to save settings. Please try again.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saveStatus === 'saving'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || modulesLoading || settingsLoading}
            className="btn-primary"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
