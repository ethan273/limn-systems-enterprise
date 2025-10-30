"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Breadcrumb } from "@/components/common";
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
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  Plus,
  AlertCircle,
  DollarSign,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewDesignProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [crmProjectId, setCrmProjectId] = useState("none");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch CRM projects
  const { data: crmProjectsData, isLoading: crmProjectsLoading, error: crmProjectsError } = api.projects.getAll.useQuery({
    limit: 100,
  });

  const utils = api.useUtils();

  // Create design project mutation
  const createDesignProjectMutation = api.designProjects.create.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.designProjects.getAll.invalidate();

      toast({
        title: "Design Project Created",
        description: data.message || "Design project created successfully",
      });
      router.push(`/design/projects/${data.project.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create design project",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/design/projects");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!projectName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a project name.",
        variant: "destructive",
      });
      return;
    }

    if (!projectType) {
      toast({
        title: "Validation Error",
        description: "Please select a project type.",
        variant: "destructive",
      });
      return;
    }

    // Create design project
    createDesignProjectMutation.mutate({
      project_name: projectName.trim(),
      project_type: projectType,
      priority,
      target_launch_date: targetCompletionDate ? new Date(targetCompletionDate) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
    });
  };

  const isFormValid = projectName.trim() && projectType;

  // Error state for CRM projects
  if (crmProjectsError) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="space-y-6">
          <Breadcrumb />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Create New Design Project</h1>
                <p className="text-muted-foreground">Start a new design project</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load CRM projects: {crmProjectsError.message}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => utils.projects.getAll.invalidate()}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="space-y-6">
        <Breadcrumb />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={createDesignProjectMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Design Project</h1>
              <p className="text-muted-foreground">Start a new design project</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The project ID will be automatically generated when you create the project.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="project-name">
                  Project Name
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={createDesignProjectMutation.isPending}
                />
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
                  disabled={crmProjectsLoading || createDesignProjectMutation.isPending}
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the design project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={createDesignProjectMutation.isPending}
                  rows={3}
                />
              </div>

              {/* Project Type */}
              <div className="space-y-2">
                <Label htmlFor="project-type">
                  Project Type
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={projectType}
                  onValueChange={setProjectType}
                  disabled={createDesignProjectMutation.isPending}
                >
                  <SelectTrigger id="project-type">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="textile">Textile</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  disabled={createDesignProjectMutation.isPending}
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

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date (Optional)</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={createDesignProjectMutation.isPending}
                />
              </div>

              {/* Target Completion Date */}
              <div className="space-y-2">
                <Label htmlFor="target-completion-date">Target Completion Date (Optional)</Label>
                <Input
                  id="target-completion-date"
                  type="date"
                  value={targetCompletionDate}
                  onChange={(e) => setTargetCompletionDate(e.target.value)}
                  disabled={createDesignProjectMutation.isPending}
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" aria-hidden="true" />
                  Budget (Optional)
                </Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  disabled={createDesignProjectMutation.isPending}
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
                  disabled={createDesignProjectMutation.isPending}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={createDesignProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createDesignProjectMutation.isPending}
            >
              {createDesignProjectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
