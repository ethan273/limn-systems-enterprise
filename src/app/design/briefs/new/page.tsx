"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader, LoadingState } from "@/components/common";

export const dynamic = 'force-dynamic';

export default function NewDesignBriefPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    design_project_id: "none",
    target_market: "",
    price_point_min: "",
    price_point_max: "",
    materials_preference: "",
    style_references: "",
    functional_requirements: "",
  });

  // Auth is handled by middleware - no client-side redirect needed

  const { data: projectsData } = api.designProjects.getAll.useQuery(
    { limit: 100 },
    { enabled: true } // Middleware ensures auth
  );

  const createBriefMutation = api.designBriefs.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const materials = formData.materials_preference
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
      const styles = formData.style_references
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const result = await createBriefMutation.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        design_project_id: formData.design_project_id === "none" ? undefined : formData.design_project_id,
        target_market: formData.target_market || undefined,
        price_point_min: formData.price_point_min ? parseFloat(formData.price_point_min) : undefined,
        price_point_max: formData.price_point_max ? parseFloat(formData.price_point_max) : undefined,
        materials_preference: materials.length > 0 ? materials : undefined,
        style_references: styles.length > 0 ? styles : undefined,
        functional_requirements: formData.functional_requirements || undefined,
      });

      toast({
        title: "Success",
        description: "Design brief created successfully!",
      });

      router.push(`/design/briefs/${result.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create design brief. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="page-container max-w-4xl">
      {/* Back Button */}
      <div className="page-header">
        <Button variant="ghost" onClick={() => router.push("/design/briefs")} className="btn-secondary">
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back to Briefs
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Create Design Brief"
        subtitle="Define requirements and specifications for a new design project"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="card-title">Basic Information</CardTitle>
            <CardDescription>Core details about the design brief</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Modern Lounge Chair Collection"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the design brief..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="design_project_id">Associated Project (Optional)</Label>
              <Select
                value={formData.design_project_id}
                onValueChange={(value) => setFormData({ ...formData, design_project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projectsData?.projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name} ({project.project_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Market & Pricing */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="card-title">Market & Pricing</CardTitle>
            <CardDescription>Target market and price range information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target_market">Target Market</Label>
              <Input
                id="target_market"
                value={formData.target_market}
                onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                placeholder="e.g., High-end hospitality, Residential luxury"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_point_min">Minimum Price ($)</Label>
                <Input
                  id="price_point_min"
                  type="number"
                  step="0.01"
                  value={formData.price_point_min}
                  onChange={(e) => setFormData({ ...formData, price_point_min: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_point_max">Maximum Price ($)</Label>
                <Input
                  id="price_point_max"
                  type="number"
                  step="0.01"
                  value={formData.price_point_max}
                  onChange={(e) => setFormData({ ...formData, price_point_max: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Specifications */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="card-title">Design Specifications</CardTitle>
            <CardDescription>Materials, styles, and functional requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materials_preference">Materials Preference</Label>
              <Input
                id="materials_preference"
                value={formData.materials_preference}
                onChange={(e) => setFormData({ ...formData, materials_preference: e.target.value })}
                placeholder="Comma-separated list, e.g., Oak, Walnut, Leather"
              />
              <p className="text-xs text-muted-foreground">
                Enter materials separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style_references">Style References</Label>
              <Input
                id="style_references"
                value={formData.style_references}
                onChange={(e) => setFormData({ ...formData, style_references: e.target.value })}
                placeholder="Comma-separated list, e.g., Mid-century modern, Scandinavian"
              />
              <p className="text-xs text-muted-foreground">
                Enter style references separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="functional_requirements">Functional Requirements</Label>
              <Textarea
                id="functional_requirements"
                value={formData.functional_requirements}
                onChange={(e) => setFormData({ ...formData, functional_requirements: e.target.value })}
                placeholder="List specific functional requirements and constraints..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/design/briefs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createBriefMutation.isPending}>
            {createBriefMutation.isPending ? "Creating..." : "Create Brief"}
          </Button>
        </div>
      </form>
    </div>
  );
}
