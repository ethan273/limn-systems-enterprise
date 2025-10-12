"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  Lightbulb,
  Users,
  Target,
  Rocket,
  Package,
  Sofa,
  Sparkles,
  Grid3x3,
} from "lucide-react";

interface CreateFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  projectId?: string;
}

const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All Templates", icon: Grid3x3 },
  { value: "brainstorming", label: "Brainstorming", icon: Lightbulb },
  { value: "client_collaboration", label: "Client Collaboration", icon: Users },
  { value: "team_building", label: "Team Building", icon: Target },
  { value: "strategic_planning", label: "Strategic Planning", icon: Rocket },
  { value: "product_development", label: "Product Development", icon: Package },
  { value: "furniture_design", label: "Furniture Design", icon: Sofa },
] as const;

export function CreateFromTemplateDialog({
  open,
  onOpenChange,
  userId,
  projectId,
}: CreateFromTemplateDialogProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [boardName, setBoardName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  // Query templates
  const { data: templates, isLoading } = api.designBoards.templates.getByCategory.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory as any,
  });

  // Create board from template mutation
  const createFromTemplateMutation = api.designBoards.templates.createBoardFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Board created from template!");
      onOpenChange(false);
      router.push(`/design/boards/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create board: ${error.message}`);
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowNameInput(true);

    // Pre-fill board name with template name
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setBoardName(`${template.name} - Copy`);
    }
  };

  const handleCreateBoard = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    if (!boardName.trim()) {
      toast.error("Please enter a board name");
      return;
    }

    createFromTemplateMutation.mutate({
      template_id: selectedTemplate,
      board_name: boardName.trim(),
      created_by: userId,
      project_id: projectId,
    });
  };

  const handleBack = () => {
    setShowNameInput(false);
    setSelectedTemplate(null);
    setBoardName("");
  };

  // Get featured templates
  const featuredTemplates = templates?.filter(t => t.is_featured) || [];
  const regularTemplates = templates?.filter(t => !t.is_featured) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {showNameInput ? "Name Your Board" : "Create from Template"}
          </DialogTitle>
          <DialogDescription>
            {showNameInput
              ? "Give your new board a name to get started"
              : "Choose a template to quickly start your design board"}
          </DialogDescription>
        </DialogHeader>

        {!showNameInput ? (
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 pb-2 border-b">
              {TEMPLATE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.value)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-sm text-muted-foreground">Loading templates...</div>
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="space-y-6">
                  {/* Featured Templates */}
                  {featuredTemplates.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Featured Templates
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featuredTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onSelect={handleTemplateSelect}
                            isSelected={selectedTemplate === template.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Templates */}
                  {regularTemplates.length > 0 && (
                    <div>
                      {featuredTemplates.length > 0 && (
                        <h3 className="text-sm font-semibold mb-3">All Templates</h3>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {regularTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onSelect={handleTemplateSelect}
                            isSelected={selectedTemplate === template.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-2">
                  <div className="text-sm text-muted-foreground">No templates available</div>
                  <div className="text-xs text-muted-foreground">
                    Templates will be added soon
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Enter board name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && boardName.trim()) {
                    handleCreateBoard();
                  }
                }}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleCreateBoard}
                disabled={!boardName.trim() || createFromTemplateMutation.isPending}
              >
                {createFromTemplateMutation.isPending ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TemplateCardProps {
  template: any;
  onSelect: (templateId: string) => void;
  isSelected: boolean;
}

function TemplateCard({ template, onSelect, isSelected }: TemplateCardProps) {
  // Get category icon
  const categoryInfo = TEMPLATE_CATEGORIES.find(c => c.value === template.category);
  const CategoryIcon = categoryInfo?.icon || Grid3x3;

  return (
    <div
      className={`
        relative border rounded-lg p-4 cursor-pointer transition-all
        hover:shadow-md hover:border-primary/50
        ${isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border'}
      `}
      onClick={() => onSelect(template.id)}
    >
      {/* Featured Badge */}
      {template.is_featured && (
        <div className="absolute top-2 right-2">
          <div className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Featured
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="bg-muted rounded-md h-32 mb-3 flex items-center justify-center">
        <CategoryIcon className="h-12 w-12 text-muted-foreground/30" />
      </div>

      {/* Template Info */}
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-sm line-clamp-1">{template.name}</h4>
          {template.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </p>
          )}
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CategoryIcon className="h-3 w-3" />
            {categoryInfo?.label || template.category}
          </div>
          {template.use_count > 0 && (
            <div className="text-xs text-muted-foreground">
              · {template.use_count} {template.use_count === 1 ? 'use' : 'uses'}
            </div>
          )}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
      )}
    </div>
  );
}
