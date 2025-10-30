"use client";

import { api } from "@/lib/api/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, EmptyState } from "@/components/common";
import { AlertTriangle, RefreshCw, Bell, Mail, MessageSquare, Clock, RotateCcw, TestTube } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Timezone options for quiet hours
const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'UTC', label: 'UTC' },
];

// Time options for quiet hours (24-hour format)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

// Category display names and descriptions
const CATEGORIES = [
  { key: 'system', label: 'System', description: 'System updates and maintenance notifications' },
  { key: 'order', label: 'Orders', description: 'Order status changes and updates' },
  { key: 'production', label: 'Production', description: 'Production status and quality control' },
  { key: 'shipping', label: 'Shipping', description: 'Shipping updates and tracking' },
  { key: 'payment', label: 'Payment', description: 'Payment confirmations and invoices' },
  { key: 'task', label: 'Tasks', description: 'Task assignments and updates' },
  { key: 'message', label: 'Messages', description: 'Direct messages and communications' },
  { key: 'alert', label: 'Alerts', description: 'Urgent alerts and critical notifications' },
] as const;

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const utils = api.useUtils();

  // Fetch current preferences
  const { data: preferences, isLoading, error } = api.notificationPreferences.getMyPreferences.useQuery();

  // Local state for form
  const [channels, setChannels] = useState({
    in_app: true,
    email: true,
    google_chat: false,
  });

  const [categories, setCategories] = useState<Record<string, { in_app?: boolean; email?: boolean; google_chat?: boolean }>>({});

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [quietHoursTimezone, setQuietHoursTimezone] = useState('America/Los_Angeles');

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setChannels(preferences.channels);

      // Transform categories from API format to form format
      const transformedCategories: Record<string, { in_app?: boolean; email?: boolean; google_chat?: boolean }> = {};
      Object.entries(preferences.categories).forEach(([key, value]: [string, any]) => {
        transformedCategories[key] = {};
        if (value.in_app !== undefined) transformedCategories[key].in_app = value.in_app;
        if (value.email !== undefined) transformedCategories[key].email = value.email;
        if (value.google_chat !== undefined) transformedCategories[key].google_chat = value.google_chat;
      });
      setCategories(transformedCategories);

      if (preferences.quiet_hours) {
        setQuietHoursEnabled(preferences.quiet_hours.enabled || false);
        setQuietHoursStart(preferences.quiet_hours.start || '22:00');
        setQuietHoursEnd(preferences.quiet_hours.end || '08:00');
        setQuietHoursTimezone(preferences.quiet_hours.timezone || 'America/Los_Angeles');
      }
    }
  }, [preferences]);

  // Mutations
  const updatePreferences = api.notificationPreferences.updateMyPreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
      utils.notificationPreferences.getMyPreferences.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPreferences = api.notificationPreferences.resetToDefaults.useMutation({
    onSuccess: () => {
      toast({
        title: "Reset complete",
        description: "Your notification preferences have been reset to defaults.",
      });
      utils.notificationPreferences.getMyPreferences.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendTest = api.notificationPreferences.sendTestNotification.useMutation({
    onSuccess: () => {
      toast({
        title: "Test sent",
        description: "A test notification has been sent to your enabled channels.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle error state
  if (error) {
    return (
      <div className="app-layout">
        <div className="app-content">
          <PageHeader
            title="Notification Settings"
            description="Manage your notification preferences"
          />
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load preferences"
            description={error.message || "An unexpected error occurred. Please try again."}
            action={{
              label: 'Try Again',
              onClick: () => {
                utils.notificationPreferences.getMyPreferences.invalidate();
              },
              icon: RefreshCw,
            }}
          />
        </div>
      </div>
    );
  }

  // Handle save
  const handleSave = () => {
    updatePreferences.mutate({
      channels,
      categories,
      quiet_hours: quietHoursEnabled ? {
        enabled: true,
        start: quietHoursStart,
        end: quietHoursEnd,
        timezone: quietHoursTimezone,
      } : null,
    });
  };

  // Handle reset
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all notification preferences to defaults?')) {
      resetPreferences.mutate();
    }
  };

  // Handle test
  const handleTest = () => {
    sendTest.mutate();
  };

  // Handle channel toggle
  const handleChannelToggle = (channel: 'in_app' | 'email' | 'google_chat') => {
    setChannels(prev => ({ ...prev, [channel]: !prev[channel] }));
  };

  // Handle category channel toggle
  const handleCategoryChannelToggle = (category: string, channel: 'in_app' | 'email' | 'google_chat') => {
    setCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel],
      },
    }));
  };

  return (
    <div className="app-layout">
      <div className="app-content">
        <PageHeader
          title="Notification Settings"
          description="Customize how and when you receive notifications"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {/* Global Channel Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Channel Preferences
                </CardTitle>
                <CardDescription>
                  Choose which channels you want to receive notifications through
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="in-app" className="text-base">In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications within the application
                    </p>
                  </div>
                  <Switch
                    id="in-app"
                    checked={channels.in_app}
                    onCheckedChange={() => handleChannelToggle('in_app')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email" className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email"
                    checked={channels.email}
                    onCheckedChange={() => handleChannelToggle('email')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="google-chat" className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Google Chat Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in Google Chat (opt-in for critical alerts)
                    </p>
                  </div>
                  <Switch
                    id="google-chat"
                    checked={channels.google_chat}
                    onCheckedChange={() => handleChannelToggle('google_chat')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category-Specific Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Categories</CardTitle>
                <CardDescription>
                  Customize notification channels for each category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {CATEGORIES.map((category) => (
                    <AccordionItem key={category.key} value={category.key}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">{category.label}</span>
                          <span className="text-sm text-muted-foreground">{category.description}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${category.key}-in-app`} className="text-sm">In-App</Label>
                            <Switch
                              id={`${category.key}-in-app`}
                              checked={categories[category.key]?.in_app ?? true}
                              onCheckedChange={() => handleCategoryChannelToggle(category.key, 'in_app')}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${category.key}-email`} className="text-sm">Email</Label>
                            <Switch
                              id={`${category.key}-email`}
                              checked={categories[category.key]?.email ?? true}
                              onCheckedChange={() => handleCategoryChannelToggle(category.key, 'email')}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${category.key}-google-chat`} className="text-sm">Google Chat</Label>
                            <Switch
                              id={`${category.key}-google-chat`}
                              checked={categories[category.key]?.google_chat ?? false}
                              onCheckedChange={() => handleCategoryChannelToggle(category.key, 'google_chat')}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>
                  Set a time range when non-urgent notifications will be silenced
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours-enabled" className="text-base">Enable Quiet Hours</Label>
                  <Switch
                    id="quiet-hours-enabled"
                    checked={quietHoursEnabled}
                    onCheckedChange={setQuietHoursEnabled}
                  />
                </div>

                {quietHoursEnabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quiet-start">Start Time</Label>
                        <Select value={quietHoursStart} onValueChange={setQuietHoursStart}>
                          <SelectTrigger id="quiet-start">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map(time => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quiet-end">End Time</Label>
                        <Select value={quietHoursEnd} onValueChange={setQuietHoursEnd}>
                          <SelectTrigger id="quiet-end">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map(time => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiet-timezone">Timezone</Label>
                      <Select value={quietHoursTimezone} onValueChange={setQuietHoursTimezone}>
                        <SelectTrigger id="quiet-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Quiet hours: {quietHoursStart} - {quietHoursEnd} ({TIMEZONES.find(tz => tz.value === quietHoursTimezone)?.label})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleSave}
                disabled={updatePreferences.isPending}
                className="flex-1 sm:flex-none"
              >
                {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
              </Button>

              <Button
                onClick={handleTest}
                disabled={sendTest.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {sendTest.isPending ? "Sending..." : "Send Test Notification"}
              </Button>

              <Button
                onClick={handleReset}
                disabled={resetPreferences.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {resetPreferences.isPending ? "Resetting..." : "Reset to Defaults"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
