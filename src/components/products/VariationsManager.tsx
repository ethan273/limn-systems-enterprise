"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface VariationsManagerProps {
  variations: string[];
  onSave: (variations: string[]) => Promise<void>;
  isEditing?: boolean;
}

export function VariationsManager({
  variations,
  onSave,
  isEditing = false,
}: VariationsManagerProps) {
  const [localVariations, setLocalVariations] = useState<string[]>(variations || []);
  const [newVariation, setNewVariation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddVariation = () => {
    if (!newVariation.trim()) {
      toast.error("Please enter a variation type");
      return;
    }

    if (localVariations.includes(newVariation.trim())) {
      toast.error("This variation type already exists");
      return;
    }

    setLocalVariations([...localVariations, newVariation.trim()]);
    setNewVariation("");
  };

  const handleRemoveVariation = (variation: string) => {
    setLocalVariations(localVariations.filter((v) => v !== variation));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localVariations);
      toast.success("Variations updated successfully");
    } catch (error) {
      toast.error("Failed to update variations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalVariations(variations || []);
    setNewVariation("");
  };

  const hasChanges = JSON.stringify(localVariations.sort()) !== JSON.stringify((variations || []).sort());

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variation Types</CardTitle>
        </CardHeader>
        <CardContent>
          {localVariations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {localVariations.map((variation, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {variation}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No variation types defined</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Variation Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Variation Types</Label>
          {localVariations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {localVariations.map((variation, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  <span>{variation}</span>
                  <button
                    onClick={() => handleRemoveVariation(variation)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No variation types defined</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-variation">Add New Variation Type</Label>
          <div className="flex gap-2">
            <Input
              id="new-variation"
              value={newVariation}
              onChange={(e) => setNewVariation(e.target.value)}
              placeholder="e.g., Size, Color, Style"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddVariation();
                }
              }}
            />
            <Button onClick={handleAddVariation} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Variation types define the different configurations available for items in this collection
            (e.g., "Small", "Medium", "Large" or "Modern", "Classic", "Contemporary")
          </p>
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
