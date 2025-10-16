"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface SpecificationsManagerProps {
  specifications: Record<string, any>;
  onSave: (specifications: Record<string, any>) => Promise<void>;
  isEditing?: boolean;
}

export function SpecificationsManager({
  specifications,
  onSave,
  isEditing = false,
}: SpecificationsManagerProps) {
  const [specs, setSpecs] = useState<Record<string, any>>(specifications || {});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSpec = () => {
    if (!newKey.trim()) {
      toast.error("Please enter a specification name");
      return;
    }

    if (specs[newKey]) {
      toast.error("A specification with this name already exists");
      return;
    }

    setSpecs({ ...specs, [newKey]: newValue });
    setNewKey("");
    setNewValue("");
    toast.success("Specification added. Click Save to persist changes.");
  };

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...specs };
    delete newSpecs[key];
    setSpecs(newSpecs);
    toast.success("Specification removed. Click Save to persist changes.");
  };

  const handleUpdateSpec = (key: string, value: any) => {
    setSpecs({ ...specs, [key]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(specs);
      toast.success("Specifications saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save specifications");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSpecs(specifications || {});
    setNewKey("");
    setNewValue("");
  };

  const hasChanges = JSON.stringify(specs) !== JSON.stringify(specifications || {});

  return (
    <div className="space-y-4">
      {/* Existing Specifications */}
      {Object.keys(specs).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <div className="mt-1 font-medium">{key}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Value</Label>
                      {isEditing ? (
                        <Input
                          value={typeof value === "object" ? JSON.stringify(value) : String(value)}
                          onChange={(e) => {
                            try {
                              // Try to parse as JSON if it looks like JSON
                              const val = e.target.value;
                              if (val.startsWith("{") || val.startsWith("[")) {
                                handleUpdateSpec(key, JSON.parse(val));
                              } else {
                                handleUpdateSpec(key, val);
                              }
                            } catch {
                              handleUpdateSpec(key, e.target.value);
                            }
                          }}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1">
                          {typeof value === "object" ? (
                            <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <div className="text-sm">{String(value)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSpec(key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No specifications yet. Add your first specification below.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Specification */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Specification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spec-key">Specification Name</Label>
                <Input
                  id="spec-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., Material, Weight, Capacity"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddSpec();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="spec-value">Value</Label>
                <Input
                  id="spec-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g., Oak Wood, 25 lbs, 300 lbs"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddSpec();
                    }
                  }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleAddSpec} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save/Cancel Actions */}
      {isEditing && hasChanges && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel Changes
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Specifications"}
          </Button>
        </div>
      )}
    </div>
  );
}
