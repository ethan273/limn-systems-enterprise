'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, EmptyState } from '@/components/common';
import {
  Settings,
  AlertTriangle,
  RefreshCw,
  Save,
  User,
  Briefcase,
  Bell,
  CheckCircle,
  Edit,
} from 'lucide-react';

/**
 * Designer Settings Page
 * Manage profile information, preferences, and notification settings
 */
export default function DesignerSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    company_name: '',
    phone: '',
    website: '',
    portfolio_url: '',
    years_experience: 0,
    hourly_rate: 0,
    currency: 'USD',
    notes: '',
  });

  // Specialties and design style
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [designStyle, setDesignStyle] = useState<string[]>([]);

  // Queries
  const { data: userInfo, isLoading: loadingUser, error: userError } = api.portal.getCurrentUser.useQuery();
  const { data: designerProfile, isLoading: loadingProfile, error: profileError } = api.portal.getDesignerProfile.useQuery();

  // Mutations
  const updateProfileMutation = api.portal.updateDesignerProfile.useMutation();
  const updateNotificationsMutation = api.portal.updateDesignerNotificationPreferences.useMutation();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Parse notification preferences from notes field
  const extractNotificationPrefs = (notes: string | null) => {
    if (!notes) return { email: true, sms: false, in_app: true };

    const match = notes.match(/\[NOTIFICATION_PREFS\](.*?)\[\/NOTIFICATION_PREFS\]/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return { email: true, sms: false, in_app: true };
      }
    }
    return { email: true, sms: false, in_app: true };
  };

  // Initialize form when data loads
  useEffect(() => {
    if (designerProfile) {
      setProfileForm({
        name: designerProfile.name || '',
        company_name: designerProfile.company_name || '',
        phone: designerProfile.phone || '',
        website: designerProfile.website || '',
        portfolio_url: designerProfile.portfolio_url || '',
        years_experience: designerProfile.years_experience || 0,
        hourly_rate: designerProfile.hourly_rate ? Number(designerProfile.hourly_rate) : 0,
        currency: designerProfile.currency || 'USD',
        notes: designerProfile.notes?.replace(/\[NOTIFICATION_PREFS\].*?\[\/NOTIFICATION_PREFS\]/g, '').trim() || '',
      });

      // Parse JSON arrays
      if (designerProfile.specialties) {
        const specs = Array.isArray(designerProfile.specialties)
          ? designerProfile.specialties
          : [];
        setSpecialties(specs as string[]);
      }
      if (designerProfile.design_style) {
        const styles = Array.isArray(designerProfile.design_style)
          ? designerProfile.design_style
          : [];
        setDesignStyle(styles as string[]);
      }

      // Extract notification preferences
      const prefs = extractNotificationPrefs(designerProfile.notes);
      setEmailNotifications(prefs.email);
      setSmsNotifications(prefs.sms);
      setInAppNotifications(prefs.in_app);
    }
  }, [designerProfile]);

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      setSaveStatus('saving');

      await updateProfileMutation.mutateAsync({
        ...profileForm,
        specialties,
        design_style: designStyle,
      });

      // Invalidate queries
      void utils.portal.getDesignerProfile.invalidate();

      setSaveStatus('success');
      setIsEditing(false);

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('idle');
    }
  };

  // Handle notifications save
  const handleSaveNotifications = async () => {
    try {
      setSaveStatus('saving');

      await updateNotificationsMutation.mutateAsync({
        emailNotifications,
        smsNotifications,
        inAppNotifications,
      });

      // Invalidate queries
      void utils.portal.getDesignerProfile.invalidate();

      setSaveStatus('success');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to save notifications:', error);
      setSaveStatus('idle');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    if (designerProfile) {
      setProfileForm({
        name: designerProfile.name || '',
        company_name: designerProfile.company_name || '',
        phone: designerProfile.phone || '',
        website: designerProfile.website || '',
        portfolio_url: designerProfile.portfolio_url || '',
        years_experience: designerProfile.years_experience || 0,
        hourly_rate: designerProfile.hourly_rate ? Number(designerProfile.hourly_rate) : 0,
        currency: designerProfile.currency || 'USD',
        notes: designerProfile.notes?.replace(/\[NOTIFICATION_PREFS\].*?\[\/NOTIFICATION_PREFS\]/g, '').trim() || '',
      });
    }
  };

  // Handle query errors
  const error = userError || profileError;
  if (error) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Designer Settings</h1>
          <p className="page-subtitle">Manage your account preferences and profile</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load settings"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              utils.portal.getCurrentUser.invalidate();
              utils.portal.getDesignerProfile.invalidate();
            },
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (loadingUser || loadingProfile) {
    return (
      <div className="page-container">
        <LoadingState message="Loading settings..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Designer Settings</h1>
        <p className="page-subtitle">Manage your account preferences and profile</p>
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-success/10 text-success border border-success/20 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Settings updated successfully</span>
        </div>
      )}

      {/* Personal Information */}
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
          {/* Name & Company */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-sm font-medium">{designerProfile?.name || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              {isEditing ? (
                <Input
                  id="company"
                  value={profileForm.company_name}
                  onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                  placeholder="Your company or studio name"
                />
              ) : (
                <p className="text-sm font-medium">{designerProfile?.company_name || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Read-only)</Label>
              <Input id="email" value={userInfo?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              ) : (
                <p className="text-sm font-medium">{designerProfile?.phone || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Website & Portfolio */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  type="url"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              ) : (
                <p className="text-sm font-medium">
                  {designerProfile?.website ? (
                    <a href={designerProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {designerProfile.website}
                    </a>
                  ) : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              {isEditing ? (
                <Input
                  id="portfolio"
                  type="url"
                  value={profileForm.portfolio_url}
                  onChange={(e) => setProfileForm({ ...profileForm, portfolio_url: e.target.value })}
                  placeholder="https://portfolio.example.com"
                />
              ) : (
                <p className="text-sm font-medium">
                  {designerProfile?.portfolio_url ? (
                    <a href={designerProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {designerProfile.portfolio_url}
                    </a>
                  ) : 'N/A'}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSaveProfile} disabled={saveStatus === 'saving'}>
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

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
          <CardDescription>Your experience and rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Experience & Rate */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              {isEditing ? (
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={profileForm.years_experience}
                  onChange={(e) => setProfileForm({ ...profileForm, years_experience: parseInt(e.target.value) || 0 })}
                />
              ) : (
                <p className="text-sm font-medium">{designerProfile?.years_experience || 0} years</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly Rate</Label>
              {isEditing ? (
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={profileForm.hourly_rate}
                  onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                />
              ) : (
                <p className="text-sm font-medium">
                  ${Number(designerProfile?.hourly_rate || 0).toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              {isEditing ? (
                <Select
                  value={profileForm.currency}
                  onValueChange={(value) => setProfileForm({ ...profileForm, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">{designerProfile?.currency || 'USD'}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            {isEditing ? (
              <Textarea
                id="notes"
                value={profileForm.notes}
                onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                placeholder="Add any additional notes about your background or expertise..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{profileForm.notes || 'No notes added'}</p>
            )}
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
          <CardDescription>Choose how you want to receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="email-notif" className="font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive project updates, deadlines, and important announcements
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
                Get text alerts for urgent deadlines and approvals
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
            <Button onClick={handleSaveNotifications} disabled={saveStatus === 'saving'}>
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === 'saving' ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <h4 className="font-medium mb-2">Change Password</h4>
            <p className="text-sm text-muted-foreground mb-4">
              To change your password, please contact support or use the password reset
              option on the login page.
            </p>
            <Button variant="outline">Request Password Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
