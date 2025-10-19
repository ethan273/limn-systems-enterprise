'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Bell,
  Save,
  Edit,
  CheckCircle,
} from 'lucide-react';
import { LoadingState } from '@/components/common';

/**
 * Customer Portal Profile Page
 * View and edit customer profile, notification preferences
 */
export default function CustomerProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Initialize notification states with defaults
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const { data: userInfo, isLoading: isLoadingUser } = api.portal.getCurrentUser.useQuery();
  const { data: portalSettings, isLoading: isLoadingSettings } = api.portal.getPortalSettings.useQuery();
  const updatePreferencesMutation = api.portal.updateNotificationPreferences.useMutation();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Extract notification preferences
  const notificationPrefs = (portalSettings?.notification_preferences as any) || {
    email: true,
    sms: false,
    in_app: true,
  };

  // Update notification states when data loads
  useEffect(() => {
    if (portalSettings?.notification_preferences) {
      const prefs = portalSettings.notification_preferences as any;
      if (typeof prefs === 'object') {
        if ('email' in prefs) setEmailNotifications(prefs.email);
        if ('sms' in prefs) setSmsNotifications(prefs.sms);
        if ('in_app' in prefs) setInAppNotifications(prefs.in_app);
      }
    }
  }, [portalSettings]);

  if (isLoadingUser || isLoadingSettings) {
    return (
      <div className="page-container">
        <LoadingState message="Loading profile..." size="lg" />
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setSaveStatus('saving');

      await updatePreferencesMutation.mutateAsync({
        emailNotifications,
        smsNotifications,
        inAppNotifications,
      });

      // Invalidate queries for instant updates
      utils.portal.getPortalSettings.invalidate();

      setSaveStatus('success');
      setIsEditing(false);

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveStatus('idle');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    if (typeof notificationPrefs === 'object') {
      setEmailNotifications(notificationPrefs.email || true);
      setSmsNotifications(notificationPrefs.sms || false);
      setInAppNotifications(notificationPrefs.in_app || true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account information and preferences</p>
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-success/10 text-success border border-success/20 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Profile updated successfully</span>
        </div>
      )}

      {/* User Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input id="name" defaultValue={''} />
              ) : (
                <p className="text-sm font-medium">N/A</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input id="email" type="email" defaultValue={userInfo?.email || ''} />
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{userInfo?.email || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input id="phone" type="tel" defaultValue={''} />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">N/A</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>User Type</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">customer</Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons (when editing) */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
                <Save className="h-4 w-4 mr-2" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Company Name</Label>
              <p className="text-sm font-medium mt-1">N/A</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Industry</Label>
              <p className="text-sm font-medium mt-1">N/A</p>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Business Address
            </Label>
            <div className="text-sm font-medium mt-1 space-y-1">
              <p className="text-muted-foreground">No address on file</p>
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
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive updates about your orders and account
          </p>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="email-notif" className="font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive order updates, invoices, and important announcements via email
              </p>
            </div>
            <Switch
              id="email-notif"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="sms-notif" className="font-medium">
                SMS Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Get text message alerts for shipping updates and urgent matters
              </p>
            </div>
            <Switch
              id="sms-notif"
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>

          {/* In-App Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="inapp-notif" className="font-medium">
                In-App Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Show notifications within the portal when you&apos;re logged in
              </p>
            </div>
            <Switch
              id="inapp-notif"
              checked={inAppNotifications}
              onCheckedChange={setInAppNotifications}
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === 'saving' ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Change Password</h4>
            <p className="text-sm text-muted-foreground mb-4">
              To change your password, please contact our support team or use the password reset
              option on the login page.
            </p>
            <Button variant="outline">Request Password Reset</Button>
          </div>
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Need Help?</h4>
            <p className="text-sm text-muted-foreground">
              If you need to update your company information or have questions about your account,
              please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
