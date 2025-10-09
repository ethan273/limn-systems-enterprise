'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  Building2,
  Save,
  AlertCircle,
  CheckCircle,
  Calendar,
  Package,
} from 'lucide-react';
import { LoadingState, PageHeader } from '@/components/common';

/**
 * Customer Portal - Profile Page
 * Allows customers to view and edit their profile information
 * Phase 3: Portal completion
 */
export default function PortalProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Fetch customer profile
  const { data: profile, isLoading, refetch } = api.portal.getCustomerProfile.useQuery();

  // Update profile mutation
  const updateProfile = api.portal.updateCustomerProfile.useMutation({
    onSuccess: () => {
      setSaveStatus('success');
      setIsEditing(false);
      refetch();
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    notes: '',
  });

  // Initialize form data when profile loads
  if (profile && !isEditing && formData.name === '') {
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company_name: profile.company_name || '',
      notes: profile.notes || '',
    });
  }

  const handleEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        notes: profile.notes || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    updateProfile.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading profile..." size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information and preferences"
      />

      {/* Status Messages */}
      {saveStatus === 'success' && (
        <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-success font-medium">Profile updated successfully!</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-medium">
            Failed to update profile. Please try again.
          </span>
        </div>
      )}

      {/* Profile Information */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <>
              {/* Edit Mode */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="pl-10"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="pl-10"
                      placeholder="Acme Corporation"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Any additional information..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saveStatus === 'saving'}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || !formData.name || !formData.email}
                  className="btn-primary"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {profile.name}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Email Address</label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Phone Number</label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {profile.phone || '—'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Company Name</label>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {profile.company_name || '—'}
                  </p>
                </div>

                {profile.notes && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Additional Notes
                    </label>
                    <p className="text-sm whitespace-pre-wrap">{profile.notes}</p>
                  </div>
                )}
              </div>

              {/* Account Metadata */}
              <div className="pt-6 border-t grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Customer Since</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(profile.created_at)}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Account Status</label>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      {profile.projects && profile.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.projects.map((project: any) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold">{project.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      Status: {project.status}
                    </p>
                  </div>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
