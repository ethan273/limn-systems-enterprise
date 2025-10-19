'use client';

import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Package } from 'lucide-react';

/**
 * Factory Settings Page
 * External portal for factories to manage their account settings
 * Phase 3: Portal router integration
 */
export default function FactorySettingsPage() {
  const { data: userInfo, isLoading } = api.portal.getCurrentUser.useQuery();

  if (isLoading) {
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
        <h1 className="page-title">Factory Settings</h1>
        <p className="page-subtitle">Manage your account preferences and profile</p>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={userInfo?.email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" type="text" placeholder="Enter your company name" />
            </div>
            <div>
              <Label htmlFor="notifications">Notification Preferences</Label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select notification preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notifications</SelectItem>
                  <SelectItem value="important">Important only</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
