"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Loader2,
  Lightbulb,
  Package,
  Briefcase,
  DollarSign,
  AlertCircle,
  X,
  Plus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewPrototypePage() {
  const router = useRouter();
  const [designProjectId, setDesignProjectId] = useState("none");
  const [crmProjectId, setCrmProjectId] = useState("none");
  const [baseItemId, setBaseItemId] = useState("none");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prototypeType, setPrototypeType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isClientSpecific, setIsClientSpecific] = useState(false);
  const [isCatalogCandidate, setIsCatalogCandidate] = useState(false);
  const [targetPriceUsd, setTargetPriceUsd] = useState("");
  const [targetCostUsd, setTargetCostUsd] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Fetch design projects
  const { data: designProjectsData, isLoading: designProjectsLoading } = api.designProjects.getAll.useQuery({
    limit: 100,
  });

  // Fetch CRM projects
  const { data: crmProjectsData, isLoading: crmProjectsLoading } = api.projects.getAll.useQuery({
    limit: 100,
  });

  // Fetch catalog items (base items)
  const { data: itemsData, isLoading: itemsLoading } = api.items.getAll.useQuery({
    limit: 100,
  });

  // Create prototype mutation
  const createPrototypeMutation = api.prototypes.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Prototype Created",
        description: data.message,
      });
      router.push(`/prototypes/${data.prototype.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create prototype",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/prototypes");
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a prototype name.",
        variant: "destructive",
      });
      return;
    }

    if (!prototypeType) {
      toast({
        title: "Validation Error",
        description: "Please select a prototype type.",
        variant: "destructive",
      });
      return;
    }

    // Create prototype
    createPrototypeMutation.mutate({
      designProjectId: designProjectId === "none" ? undefined : designProjectId,
      crmProjectId: crmProjectId === "none" ? undefined : crmProjectId,
      baseItemId: baseItemId === "none" ? undefined : baseItemId,
      name: name.trim(),
      description: description.trim() || undefined,
      prototypeType,
      priority,
      isClientSpecific,
      isCatalogCandidate,
      targetPriceUsd: targetPriceUsd ? parseFloat(targetPriceUsd) : undefined,
      targetCostUsd: targetCostUsd ? parseFloat(targetCostUsd) : undefined,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const isFormValid = name.trim() && prototypeType;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={createPrototypeMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Prototype</h1>
              <p className="text-muted-foreground">Define a new prototype for development</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The prototype number will be automatically generated when you create the prototype.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Prototype Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Design Project */}
              <div className="space-y-2">
                <Label htmlFor="design-project" className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" aria-hidden="true" />
                  Design Project (Optional)
                </Label>
                <Select
                  value={designProjectId}
                  onValueChange={setDesignProjectId}
                  disabled={designProjectsLoading || createPrototypeMutation.isPending}
                >
                  <SelectTrigger id="design-project">
                    <SelectValue placeholder="Select design project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Design Project</SelectItem>
                    {designProjectsData?.projects?.map((project: { id: string; project_name: string }) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CRM Project */}
              <div className="space-y-2">
                <Label htmlFor="crm-project" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" aria-hidden="true" />
                  CRM Project (Optional)
                </Label>
                <Select
                  value={crmProjectId}
                  onValueChange={setCrmProjectId}
                  disabled={crmProjectsLoading || createPrototypeMutation.isPending}
                >
                  <SelectTrigger id="crm-project">
                    <SelectValue placeholder="Select CRM project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No CRM Project</SelectItem>
                    {crmProjectsData?.items?.map((project: { id: string; name: string }) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Base Item */}
              <div className="space-y-2">
                <Label htmlFor="base-item" className="flex items-center gap-2">
                  <Package className="w-4 h-4" aria-hidden="true" />
                  Base Item (Optional)
                </Label>
                <Select
                  value={baseItemId}
                  onValueChange={setBaseItemId}
                  disabled={itemsLoading || createPrototypeMutation.isPending}
                >
                  <SelectTrigger id="base-item">
                    <SelectValue placeholder="Select base item from catalog" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Base Item</SelectItem>
                    {itemsData?.items?.map((item: { id: string; name: string; sku_full: string | null }) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} {item.sku_full ? `(${item.sku_full})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prototype Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Prototype Name
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter prototype name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createPrototypeMutation.isPending}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the prototype..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={createPrototypeMutation.isPending}
                  rows={3}
                />
              </div>

              {/* Prototype Type */}
              <div className="space-y-2">
                <Label htmlFor="prototype-type">
                  Prototype Type
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={prototypeType}
                  onValueChange={setPrototypeType}
                  disabled={createPrototypeMutation.isPending}
                >
                  <SelectTrigger id="prototype-type">
                    <SelectValue placeholder="Select prototype type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="textile">Textile</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  disabled={createPrototypeMutation.isPending}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-client-specific"
                    checked={isClientSpecific}
                    onCheckedChange={(checked) => setIsClientSpecific(checked as boolean)}
                    disabled={createPrototypeMutation.isPending}
                  />
                  <Label
                    htmlFor="is-client-specific"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Is Client Specific
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-catalog-candidate"
                    checked={isCatalogCandidate}
                    onCheckedChange={(checked) => setIsCatalogCandidate(checked as boolean)}
                    disabled={createPrototypeMutation.isPending}
                  />
                  <Label
                    htmlFor="is-catalog-candidate"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Is Catalog Candidate
                  </Label>
                </div>
              </div>

              {/* Target Price */}
              <div className="space-y-2">
                <Label htmlFor="target-price" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" aria-hidden="true" />
                  Target Price USD (Optional)
                </Label>
                <Input
                  id="target-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={targetPriceUsd}
                  onChange={(e) => setTargetPriceUsd(e.target.value)}
                  disabled={createPrototypeMutation.isPending}
                />
              </div>

              {/* Target Cost */}
              <div className="space-y-2">
                <Label htmlFor="target-cost" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" aria-hidden="true" />
                  Target Cost USD (Optional)
                </Label>
                <Input
                  id="target-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={targetCostUsd}
                  onChange={(e) => setTargetCostUsd(e.target.value)}
                  disabled={createPrototypeMutation.isPending}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={createPrototypeMutation.isPending}
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    id="tags"
                    placeholder="Type a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    disabled={createPrototypeMutation.isPending}
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={createPrototypeMutation.isPending}
                            className="hover:text-primary/70"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add tags to help organize and find prototypes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={createPrototypeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createPrototypeMutation.isPending}
            >
              {createPrototypeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create Prototype
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
