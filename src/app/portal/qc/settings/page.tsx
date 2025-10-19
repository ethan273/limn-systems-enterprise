'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  User,
  Bell,
  Save,
  Building2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/common';

/**
 * QC Portal Settings
 * Manage QC portal preferences and account settings
 */
export default function QCSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const { data: userInfo, isLoading: isLoadingUser, error: userError } = api.portal.getCurrentUser.useQuery();
  const { data: _portalSettings, isLoading: isLoadingSettings, error: settingsError } = api.portal.getPortalSettings.useQuery();
  const updatePreferencesMutation = api.portal.updateNotificationPreferences.useMutation();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Handle query errors
  if (userError || settingsError) {
    const error = userError || settingsError;
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your QC portal preferences</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load settings"
          description={error?.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              if (userError) utils.portal.getCurrentUser.invalidate();
              if (settingsError) utils.portal.getPortalSettings.invalidate();
            },
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoadingUser || isLoadingSettings) {
    return (
      <div className="page-container">
        <LoadingState message="Loading settings..." size="lg" />
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setSaving(true);

      await updatePreferencesMutation.mutateAsync({
        emailNotifications,
        smsNotifications,
        inAppNotifications,
      });

      // Invalidate queries for instant updates
      utils.portal.getPortalSettings.invalidate();
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your QC portal preferences</p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userInfo?.email || ''}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  value="QC Testing Company"
                  disabled
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notif"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notif">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS
              </p>
            </div>
            <Switch
              id="sms-notif"
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="app-notif">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the portal
              </p>
            </div>
            <Switch
              id="app-notif"
              checked={inAppNotifications}
              onCheckedChange={setInAppNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Portal Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Portal Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Quality Checks</p>
                <p className="text-sm text-muted-foreground">Access to inspection management</p>
              </div>
              <div className="text-sm text-success font-medium">Enabled</div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Reports</p>
                <p className="text-sm text-muted-foreground">Access to inspection reports</p>
              </div>
              <div className="text-sm text-success font-medium">Enabled</div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Documents</p>
                <p className="text-sm text-muted-foreground">Access to document library</p>
              </div>
              <div className="text-sm text-success font-medium">Enabled</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        {isEditing && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
