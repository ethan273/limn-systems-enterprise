"use client";
import { log } from '@/lib/logger';

import { useState } from "react";
import { api as _api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger as _AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
 FileText,
 Plus,
 MoreVertical,
 Edit,
 Trash2,
 Copy,
 Play,
 Star,
 Clock,
 Tag,
 Users as _Users,
} from "lucide-react";

type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

interface TaskTemplate {
 id: string;
 name: string;
 description: string;
 category: string;
 priority: TaskPriority;
 department: TaskDepartment;
 estimatedHours?: number;
 tags: string[];
 isDefault: boolean;
 isFavorite: boolean;
 usageCount: number;
 createdBy: string;
 createdAt: Date;
 tasks: {
 title: string;
 description: string;
 priority?: TaskPriority;
 department?: TaskDepartment;
 estimatedHours?: number;
 estimated_hours?: number;
 tags: string[];
 order: number;
 }[];
}

interface TaskTemplatesProps {
 onCreateFromTemplate?: (_templateId: string) => void;
}

export default function TaskTemplates({ onCreateFromTemplate }: TaskTemplatesProps) {
 const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
 const [selectedCategory, setSelectedCategory] = useState<string>('all');
 const [searchQuery, setSearchQuery] = useState("");
 const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

 // Form state for creating new template
 const [templateName, setTemplateName] = useState("");
 const [templateDescription, setTemplateDescription] = useState("");
 const [templateCategory, setTemplateCategory] = useState("general");
 const [templatePriority, setTemplatePriority] = useState<TaskPriority>('medium');
 const [templateDepartment, setTemplateDepartment] = useState<TaskDepartment>('admin');
 const [templateTags, setTemplateTags] = useState<string[]>([]);
 const [templateTasks, setTemplateTasks] = useState<{ title: string; description: string; priority?: TaskPriority; department?: TaskDepartment; estimatedHours?: number; estimated_hours?: number; tags: string[]; order: number }[]>([
 { title: "", description: "", tags: [], order: 0 }
 ]);

 // Mock templates data
 const [templates] = useState<TaskTemplate[]>([
 {
 id: "1",
 name: "Bug Fix Workflow",
 description: "Standard process for fixing bugs in production",
 category: "development",
 priority: 'high',
 department: 'production',
 estimatedHours: 8,
 tags: ['bug', 'hotfix'],
 isDefault: true,
 isFavorite: true,
 usageCount: 15,
 createdBy: "550e8400-e29b-41d4-a716-446655440000",
 createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
 tasks: [
 { title: "Reproduce the bug", description: "Verify the bug exists and document steps", estimatedHours: 1, tags: ['investigation'], order: 0 },
 { title: "Identify root cause", description: "Debug and find the source of the issue", estimatedHours: 2, tags: ['analysis'], order: 1 },
 { title: "Implement fix", description: "Code the solution", estimatedHours: 3, tags: ['development'], order: 2 },
 { title: "Test fix", description: "Verify the fix works and doesn't break anything", estimatedHours: 1, tags: ['testing'], order: 3 },
 { title: "Deploy to production", description: "Release the fix", estimatedHours: 1, tags: ['deployment'], order: 4 },
 ]
 },
 {
 id: "2",
 name: "Feature Development",
 description: "Complete workflow for developing new features",
 category: "development",
 priority: 'medium',
 department: 'design',
 estimatedHours: 40,
 tags: ['feature', 'development'],
 isDefault: false,
 isFavorite: false,
 usageCount: 8,
 createdBy: "550e8400-e29b-41d4-a716-446655440000",
 createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
 tasks: [
 { title: "Requirements gathering", description: "Define feature requirements", estimatedHours: 4, tags: ['planning'], order: 0 },
 { title: "Design mockups", description: "Create UI/UX designs", estimatedHours: 8, tags: ['design'], order: 1 },
 { title: "Technical specification", description: "Write technical specs", estimatedHours: 4, tags: ['documentation'], order: 2 },
 { title: "Implementation", description: "Code the feature", estimatedHours: 16, tags: ['development'], order: 3 },
 { title: "Testing", description: "QA testing", estimatedHours: 4, tags: ['testing'], order: 4 },
 { title: "Documentation", description: "Update user docs", estimatedHours: 2, tags: ['documentation'], order: 5 },
 { title: "Release", description: "Deploy feature", estimatedHours: 2, tags: ['deployment'], order: 6 },
 ]
 },
 {
 id: "3",
 name: "Client Onboarding",
 description: "Process for onboarding new clients",
 category: "sales",
 priority: 'high',
 department: 'sales',
 estimatedHours: 16,
 tags: ['client', 'onboarding'],
 isDefault: false,
 isFavorite: true,
 usageCount: 22,
 createdBy: "660e8400-e29b-41d4-a716-446655440001",
 createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
 tasks: [
 { title: "Welcome call", description: "Initial welcome and introduction", estimatedHours: 1, tags: ['communication'], order: 0 },
 { title: "Account setup", description: "Create client accounts and access", estimatedHours: 2, tags: ['setup'], order: 1 },
 { title: "Requirements review", description: "Discuss and document client needs", estimatedHours: 4, tags: ['planning'], order: 2 },
 { title: "Contract finalization", description: "Review and sign contracts", estimatedHours: 2, tags: ['legal'], order: 3 },
 { title: "Project kickoff", description: "Start first project", estimatedHours: 4, tags: ['kickoff'], order: 4 },
 { title: "Follow-up", description: "Check in after first week", estimatedHours: 1, tags: ['communication'], order: 5 },
 ]
 },
 ]);

 const categories = [
 { value: 'all', label: 'All Categories' },
 { value: 'development', label: 'Development' },
 { value: 'sales', label: 'Sales' },
 { value: 'design', label: 'Design' },
 { value: 'marketing', label: 'Marketing' },
 { value: 'general', label: 'General' },
 ];

 const addTask = () => {
 setTemplateTasks([...templateTasks, { title: "", description: "", tags: [], order: templateTasks.length }]);
 };

 const removeTask = (index: number) => {
 setTemplateTasks(templateTasks.filter((_, i) => i !== index));
 };

 const updateTask = (index: number, field: string, value: string | number) => {
 const updatedTasks = [...templateTasks];
 const currentTask = updatedTasks.at(index);
 if (currentTask && index >= 0 && index < updatedTasks.length) {
 const validFields = ['title', 'description', 'priority', 'department', 'estimated_hours'] as const;
 if (validFields.includes(field as any)) {
 const newTask = { ...currentTask };
 switch (field) {
 case 'title':
 newTask.title = value as string;
 break;
 case 'description':
 newTask.description = value as string;
 break;
 case 'priority':
 newTask.priority = value as TaskPriority;
 break;
 case 'department':
 newTask.department = value as TaskDepartment;
 break;
 case 'estimated_hours':
 newTask.estimated_hours = value as number;
 break;
 }
 if (index >= 0 && index < updatedTasks.length) {
 updatedTasks.splice(index, 1, newTask);
 }
 }
 }
 setTemplateTasks(updatedTasks);
 };

 const createTemplate = () => {
 if (!templateName.trim()) return;

 const newTemplate: Partial<TaskTemplate> = {
 name: templateName,
 description: templateDescription,
 category: templateCategory,
 priority: templatePriority,
 department: templateDepartment,
 tags: templateTags,
 tasks: templateTasks.filter(task => task.title.trim()),
 };

 log.info('Creating template:', { newTemplate });
 // Here you would call the API to create the template

 // Reset form
 setTemplateName("");
 setTemplateDescription("");
 setTemplateCategory("general");
 setTemplatePriority('medium');
 setTemplateDepartment('admin');
 setTemplateTags([]);
 setTemplateTasks([{ title: "", description: "", tags: [], order: 0 }]);
 setIsCreateDialogOpen(false);
 };

 const handleUseTemplate = (templateId: string) => {
 log.info('Using template:', { templateId });
 onCreateFromTemplate?.(templateId);
 };

 const deleteTemplate = (templateId: string) => {
 log.info('Deleting template:', { templateId });
 // Here you would call the API to delete the template
 setTemplateToDelete(null);
 };

 const filteredTemplates = templates.filter(template => {
 const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
 const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
 return matchesCategory && matchesSearch;
 });

 const getPriorityColor = (priority: TaskPriority) => {
 switch (priority) {
 case 'high':
 return 'bg-destructive/20 text-destructive border-destructive/20';
 case 'medium':
 return 'bg-warning/20 text-warning border-warning/20';
 case 'low':
 return 'bg-success/20 text-success border-success/20';
 }
 };

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-xl font-bold text-primary flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Task Templates
 </h2>
 <p className="text-secondary">
 Create and manage reusable task templates for common workflows
 </p>
 </div>
 <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
 <DialogTrigger asChild>
 <Button>
 <Plus className="h-4 w-4 mr-2" />
 New Template
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Create Task Template</DialogTitle>
 </DialogHeader>
 <div className="space-y-6">
 {/* Template Info */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-medium text-tertiary">Template Name *</label>
 <Input
 value={templateName}
 onChange={(e) => setTemplateName(e.target.value)}
 placeholder="e.g., Bug Fix Workflow"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-tertiary">Category</label>
 <Select value={templateCategory} onValueChange={setTemplateCategory}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {categories.filter(cat => cat.value !== 'all').map((category) => (
 <SelectItem key={category.value} value={category.value}>
 {category.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium text-tertiary">Description</label>
 <Textarea
 value={templateDescription}
 onChange={(e) => setTemplateDescription(e.target.value)}
 placeholder="Describe what this template is for..."
 rows={2}
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-medium text-tertiary">Default Priority</label>
 <Select value={templatePriority} onValueChange={(value: TaskPriority) => setTemplatePriority(value)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="low">Low</SelectItem>
 <SelectItem value="medium">Medium</SelectItem>
 <SelectItem value="high">High</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-tertiary">Default Department</label>
 <Select value={templateDepartment} onValueChange={(value: TaskDepartment) => setTemplateDepartment(value)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="admin">Admin</SelectItem>
 <SelectItem value="production">Production</SelectItem>
 <SelectItem value="design">Design</SelectItem>
 <SelectItem value="sales">Sales</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* Template Tasks */}
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <label className="text-sm font-medium text-tertiary">Template Tasks</label>
 <Button type="button" variant="outline" size="sm" onClick={addTask}>
 <Plus className="h-4 w-4 mr-1" />
 Add Task
 </Button>
 </div>
 <div className="space-y-2">
 {templateTasks.map((task, index) => (
 <div key={index} className="flex gap-2 p-3 card/30 rounded border border/50">
 <div className="flex-1 space-y-2">
 <Input
 value={task.title}
 onChange={(e) => updateTask(index, 'title', e.target.value)}
 placeholder="Task title"
 className="text-sm"
 />
 <Textarea
 value={task.description}
 onChange={(e) => updateTask(index, 'description', e.target.value)}
 placeholder="Task description (optional)"
 rows={2}
 className="text-sm"
 />
 </div>
 <div className="w-24">
 <Input
 type="number"
 min="0"
 step="0.5"
 value={task.estimatedHours?.toString() || ""}
 onChange={(e) => {
 const value = e.target.value;
 updateTask(index, 'estimatedHours', value ? parseFloat(value) : 0);
 }}
 placeholder="Hours"
 className="text-sm"
 />
 </div>
 {templateTasks.length > 1 && (
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => removeTask(index)}
 className="text-destructive hover:text-destructive"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 )}
 </div>
 ))}
 </div>
 </div>

 <div className="flex justify-end gap-2">
 <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
 Cancel
 </Button>
 <Button onClick={createTemplate} disabled={!templateName.trim()}>
 Create Template
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 {/* Filters */}
 <div className="flex gap-4">
 <div className="flex-1">
 <Input
 placeholder="Search templates..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="max-w-sm"
 />
 </div>
 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
 <SelectTrigger className="w-48">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {categories.map((category) => (
 <SelectItem key={category.value} value={category.value}>
 {category.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Templates Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredTemplates.map((template) => (
 <Card key={template.id} className="card border hover:border transition-colors">
 <CardHeader>
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 <CardTitle className="text-lg">{template.name}</CardTitle>
 {template.isFavorite && <Star className="h-4 w-4 text-warning fill-current" />}
 {template.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
 </div>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => handleUseTemplate(template.id)}>
 <Play className="h-4 w-4 mr-2" />
 Use Template
 </DropdownMenuItem>
 <DropdownMenuItem>
 <Copy className="h-4 w-4 mr-2" />
 Duplicate
 </DropdownMenuItem>
 <DropdownMenuItem>
 <Edit className="h-4 w-4 mr-2" />
 Edit
 </DropdownMenuItem>
 <DropdownMenuItem
 className="text-destructive"
 onClick={() => setTemplateToDelete(template.id)}
 >
 <Trash2 className="h-4 w-4 mr-2" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-tertiary">{template.description}</p>

 <div className="flex flex-wrap gap-2">
 <Badge variant="outline" className={`text-xs ${getPriorityColor(template.priority)}`}>
 {template.priority}
 </Badge>
 <Badge variant="outline" className={`text-xs department-${template.department}`}>
 {template.department}
 </Badge>
 {template.estimatedHours && (
 <Badge variant="outline" className="text-xs">
 <Clock className="h-3 w-3 mr-1" />
 {template.estimatedHours}h
 </Badge>
 )}
 </div>

 <div className="flex flex-wrap gap-1">
 {template.tags.slice(0, 3).map((tag) => (
 <Badge key={tag} variant="secondary" className="text-xs">
 <Tag className="h-2 w-2 mr-1" />
 {tag}
 </Badge>
 ))}
 {template.tags.length > 3 && (
 <Badge variant="secondary" className="text-xs">
 +{template.tags.length - 3}
 </Badge>
 )}
 </div>

 <div className="flex items-center justify-between text-xs text-secondary">
 <span>{template.tasks.length} tasks</span>
 <span>Used {template.usageCount} times</span>
 </div>

 <Button
 className="w-full"
 size="sm"
 onClick={() => handleUseTemplate(template.id)}
 >
 <Play className="h-4 w-4 mr-2" />
 Use Template
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>

 {filteredTemplates.length === 0 && (
 <div className="text-center py-12 text-tertiary">
 <FileText className="h-12 w-12 mx-auto mb-4 text-secondary" />
 <h3 className="text-lg font-medium mb-2">No templates found</h3>
 <p className="text-sm">Try adjusting your search or create a new template.</p>
 </div>
 )}

 {/* Delete Confirmation Dialog */}
 <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete Template</AlertDialogTitle>
 <AlertDialogDescription>
 Are you sure you want to delete this template? This action cannot be undone.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={() => templateToDelete && deleteTemplate(templateToDelete)}
 className="bg-destructive hover:bg-destructive"
 >
 Delete Template
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 );
}