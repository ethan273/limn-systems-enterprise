"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface SettingFormData {
  category: string;
  key: string;
  value: string;
}

export default function SystemSettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [formData, setFormData] = useState<SettingFormData>({
    category: '',
    key: '',
    value: '',
  });

  // Fetch all settings
  const { data: settings, isLoading } = api.admin.settings.getAll.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Update mutation
  const updateMutation = api.admin.settings.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
      // Invalidate queries for instant updates
      utils.admin.settings.getAll.invalidate();
      setIsEditDialogOpen(false);
      setEditingSetting(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = api.admin.settings.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });
      // Invalidate queries for instant updates
      utils.admin.settings.getAll.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete setting",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.category || !formData.key) {
      toast({
        title: "Validation Error",
        description: "Category and key are required",
        variant: "destructive",
      });
      return;
    }

    let parsedValue: any = formData.value;
    try {
      // Try to parse as JSON
      parsedValue = JSON.parse(formData.value);
    } catch {
      // If parsing fails, use as string
      parsedValue = formData.value;
    }

    updateMutation.mutate({
      category: formData.category,
      key: formData.key,
      value: parsedValue,
    });
    setIsCreateDialogOpen(false);
    setFormData({ category: '', key: '', value: '' });
  };

  const handleEdit = () => {
    if (!editingSetting) return;

    let parsedValue: any = formData.value;
    try {
      parsedValue = JSON.parse(formData.value);
    } catch {
      parsedValue = formData.value;
    }

    updateMutation.mutate({
      category: editingSetting.category,
      key: editingSetting.key,
      value: parsedValue,
    });
  };

  const handleDelete = (category: string, key: string) => {
    if (confirm(`Are you sure you want to delete this setting: ${category}.${key}?`)) {
      deleteMutation.mutate({ category, key });
    }
  };

  const openEditDialog = (category: string, setting: any) => {
    setEditingSetting({ ...setting, category });
    setFormData({
      category,
      key: setting.key,
      value: typeof setting.value === 'object' ? JSON.stringify(setting.value, null, 2) : String(setting.value || ''),
    });
    setIsEditDialogOpen(true);
  };

  const categories = settings ? Object.keys(settings).sort() : [];
  const displayCategory = selectedCategory || categories[0] || '';
  // eslint-disable-next-line security/detect-object-injection
  const categorySettings = settings?.[displayCategory] || [];

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-description">
            Manage global system configuration and preferences
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="icon-sm" aria-hidden="true" />
          Add Setting
        </Button>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading settings...</div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="empty-state">
            <Settings className="icon-lg icon-muted" aria-hidden="true" />
            <p className="empty-state-title">No Settings Found</p>
            <p className="empty-state-description">
              Create your first system setting to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="icon-sm" aria-hidden="true" />
              Add Setting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="list-container">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`list-item-button ${displayCategory === category ? 'list-item-active' : ''}`}
                  >
                    <Settings className="icon-sm icon-muted" aria-hidden="true" />
                    <span>{category}</span>
                    <Badge variant="outline" className="badge-neutral">
                      {/* eslint-disable-next-line security/detect-object-injection */}
                      {settings?.[category]?.length || 0}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings List */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{displayCategory}</CardTitle>
              </CardHeader>
              <CardContent>
                {categorySettings.length === 0 ? (
                  <div className="empty-state-sm">No settings in this category</div>
                ) : (
                  <div className="space-y-4">
                    {categorySettings.map((setting: any) => (
                      <div key={setting.id} className="setting-item">
                        <div className="setting-item-main">
                          <div>
                            <div className="setting-item-key">{setting.key}</div>
                            <div className="setting-item-value">
                              {typeof setting.value === 'object'
                                ? JSON.stringify(setting.value)
                                : String(setting.value)}
                            </div>
                            {setting.updatedAt && (
                              <div className="setting-item-meta">
                                Last updated: {format(new Date(setting.updatedAt), 'MMM d, yyyy h:mm a')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="setting-item-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(displayCategory, setting)}
                          >
                            <Edit2 className="icon-sm" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(displayCategory, setting.key)}
                          >
                            <Trash2 className="icon-sm icon-destructive" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Setting</DialogTitle>
            <DialogDescription>
              Create a new system setting. Use JSON format for complex values.
            </DialogDescription>
          </DialogHeader>
          <div className="form-container">
            <div className="form-field">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., email, notifications, security"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., smtp_host, max_login_attempts"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder='e.g., smtp.example.com or {"enabled": true}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="icon-sm" aria-hidden="true" />
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={updateMutation.isPending}>
              <Save className="icon-sm" aria-hidden="true" />
              Save Setting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update the setting value. Use JSON format for complex values.
            </DialogDescription>
          </DialogHeader>
          <div className="form-container">
            <div className="form-field">
              <Label>Category</Label>
              <Input value={formData.category} disabled />
            </div>
            <div className="form-field">
              <Label>Key</Label>
              <Input value={formData.key} disabled />
            </div>
            <div className="form-field">
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="icon-sm" aria-hidden="true" />
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              <Save className="icon-sm" aria-hidden="true" />
              Update Setting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
