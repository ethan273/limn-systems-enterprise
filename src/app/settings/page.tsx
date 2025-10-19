"use client";

import { api } from "@/lib/api/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/common";
import { getUserFirstName, getUserLastName } from "@/lib/utils/user-utils";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: user } = api.userProfile.getCurrentUser.useQuery();
  const { data: preferences, isLoading: prefsLoading } = api.userProfile.getPreferences.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const userData = user as any;
  const userPrefs = preferences as any;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Update local state when user data loads
  useEffect(() => {
    if (userData) {
      setFirstName(getUserFirstName(userData));
      setLastName(getUserLastName(userData));
      setEmail(userData.email || "");
    }
  }, [userData]);

  const updateProfile = api.userProfile.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      // Invalidate user profile query to refresh data
      utils.userProfile.getCurrentUser.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePreferences = api.userProfile.updatePreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      });
      // Invalidate preferences query to refresh data
      utils.userProfile.getPreferences.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({
      first_name: firstName,
      last_name: lastName,
      email
    });
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updatePreferences.mutate({ theme });
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    updatePreferences.mutate({
      [type]: value,
    });
  };

  return (
    <div className="app-layout">
      <div className="app-content">
        <PageHeader
          title="Settings"
          description="Manage your account settings and preferences"
        />

        <div className="max-w-4xl">
          {/* Profile Section */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Profile</h2>
              <p className="card-description">Update your personal information</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                {userData?.user_type && (
                  <div className="space-y-2">
                    <Label>User Type</Label>
                    <div className="text-sm text-muted-foreground capitalize">
                      {userData.user_type} {userData.department ? `• ${userData.department}` : ''}
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Preferences</h2>
              <p className="card-description">Customize your experience</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={userPrefs?.theme || "system"}
                    onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <div className="text-sm text-muted-foreground">
                    {userPrefs?.timezone || "UTC"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <div className="text-sm text-muted-foreground">
                    {userPrefs?.language || "en"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Notifications</h2>
              <p className="card-description">Manage how you receive notifications</p>
            </div>
            <div className="card-content">
              {prefsLoading ? (
                <div className="text-sm text-muted-foreground">Loading preferences...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </div>
                    </div>
                    <Button
                      variant={userPrefs?.notification_email ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleNotificationChange("notification_email", !userPrefs?.notification_email)}
                      disabled={updatePreferences.isPending}
                      className="min-w-[90px]"
                    >
                      {updatePreferences.isPending ? "..." : userPrefs?.notification_email ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </div>
                    </div>
                    <Button
                      variant={userPrefs?.notification_sms ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleNotificationChange("notification_sms", !userPrefs?.notification_sms)}
                      disabled={updatePreferences.isPending}
                      className="min-w-[90px]"
                    >
                      {updatePreferences.isPending ? "..." : userPrefs?.notification_sms ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications in the application
                      </div>
                    </div>
                    <Button
                      variant={userPrefs?.notification_in_app ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleNotificationChange("notification_in_app", !userPrefs?.notification_in_app)}
                      disabled={updatePreferences.isPending}
                      className="min-w-[90px]"
                    >
                      {updatePreferences.isPending ? "..." : userPrefs?.notification_in_app ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
