/**
 * Email Templates Admin Page
 *
 * UI for managing email templates
 *
 * @module admin/email-templates
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/common';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { EmailTemplate } from '@/lib/services/email-types';

export default function EmailTemplatesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  // Queries
  const { data: templates, isLoading, refetch } = api.emailTemplates.list.useQuery();

  // Mutations
  const createMutation = api.emailTemplates.create.useMutation({
    onSuccess: () => {
      toast.success('Template created successfully');
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateMutation = api.emailTemplates.update.useMutation({
    onSuccess: () => {
      toast.success('Template updated successfully');
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteMutation = api.emailTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success('Template deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const { data: preview } = api.emailTemplates.render.useQuery(
    {
      templateId: selectedTemplate?.id ?? '',
      variables: previewVariables,
    },
    { enabled: isPreviewDialogOpen && !!selectedTemplate }
  );

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    createMutation.mutate({
      template_key: formData.get('template_key') as string,
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      html_content: formData.get('html_content') as string,
      text_content: (formData.get('text_content') as string) || undefined,
      language: (formData.get('language') as string) || 'en',
      is_active: formData.get('is_active') === 'on',
    });
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTemplate) return;

    const formData = new FormData(event.currentTarget);

    updateMutation.mutate({
      id: selectedTemplate.id,
      data: {
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        html_content: formData.get('html_content') as string,
        text_content: (formData.get('text_content') as string) || undefined,
        language: (formData.get('language') as string) || 'en',
        is_active: formData.get('is_active') === 'on',
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate({ id });
    }
  };

  const openPreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    // Initialize preview variables with placeholders
    const vars: Record<string, string> = {};
    template.variables.forEach((v) => {
      vars[v] = `[${v}]`;
    });
    setPreviewVariables(vars);
    setIsPreviewDialogOpen(true);
  };

  const openEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable email templates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a new reusable email template with variables
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template_key">Template Key</Label>
                  <Input
                    id="template_key"
                    name="template_key"
                    placeholder="welcome_email"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for this template (lowercase, underscores only)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Welcome Email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Welcome to {{company_name}}!"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {`{{variable_name}}`} for dynamic content
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html_content">HTML Content</Label>
                  <Textarea
                    id="html_content"
                    name="html_content"
                    placeholder="<h1>Welcome {{user_name}}!</h1>"
                    rows={10}
                    required
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_content">Plain Text Content (Optional)</Label>
                  <Textarea
                    id="text_content"
                    name="text_content"
                    placeholder="Welcome {{user_name}}!"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      name="language"
                      placeholder="en"
                      defaultValue="en"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Switch id="is_active" name="is_active" defaultChecked />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            {templates?.length ?? 0} templates available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Template Key</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {template.template_key}
                    </code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {template.subject}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">
                          {v}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview your template with sample data
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <Tabs defaultValue="preview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject:</Label>
                  <div className="rounded border bg-muted p-3">
                    {preview?.subject ?? selectedTemplate.subject}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>HTML Preview:</Label>
                  <div
                    className="rounded border bg-background p-4"
                    dangerouslySetInnerHTML={{
                      __html: preview?.html ?? selectedTemplate.html_content,
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="html">
                <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
                  <code>{selectedTemplate.html_content}</code>
                </pre>
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set values for template variables to see preview
                </p>
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={`var-${variable}`}>{variable}</Label>
                    <Input
                      id={`var-${variable}`}
                      value={previewVariables[variable] ?? ''}
                      onChange={(e) =>
                        setPreviewVariables({
                          ...previewVariables,
                          [variable]: e.target.value,
                        })
                      }
                      placeholder={`Enter ${variable}`}
                    />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Key</Label>
                  <Input value={selectedTemplate.template_key} disabled />
                  <p className="text-xs text-muted-foreground">
                    Template key cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedTemplate.name}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject Line</Label>
                  <Input
                    id="edit-subject"
                    name="subject"
                    defaultValue={selectedTemplate.subject}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-html">HTML Content</Label>
                  <Textarea
                    id="edit-html"
                    name="html_content"
                    defaultValue={selectedTemplate.html_content}
                    rows={10}
                    required
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-text">Plain Text Content</Label>
                  <Textarea
                    id="edit-text"
                    name="text_content"
                    defaultValue={selectedTemplate.text_content ?? ''}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-language">Language</Label>
                    <Input
                      id="edit-language"
                      name="language"
                      defaultValue={selectedTemplate.language}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="edit-is_active"
                      name="is_active"
                      defaultChecked={selectedTemplate.is_active}
                    />
                    <Label htmlFor="edit-is_active">Active</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Template'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
