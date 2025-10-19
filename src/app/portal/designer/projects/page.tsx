'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Palette,
  Clock,
  Calendar,
  Search,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Designer Projects List Page
 * External portal for designers to view and manage all their assigned projects
 * Phase 3: Portal router integration
 */
export default function DesignerProjectsPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [searchQuery, setSearchQuery] = useState('');

  // Use portal router procedures
  const { data: _userInfo, error: userError } = api.portal.getCurrentUser.useQuery();
  const { data: projectsData, isLoading, error: projectsError } = api.portal.getDesignerProjects.useQuery({
    limit: 100,
    offset: 0,
  });

  const projects = projectsData?.projects || [];

  // Filter projects based on search query
  const filteredProjects = projects.filter((project: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.project_name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.current_stage?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusLabels: Record<string, string> = {
      concept: 'Concept',
      sketching: 'Sketching',
      rendering: 'Rendering',
      revisions: 'Revisions',
      approved: 'Approved',
    };
    return <Badge variant="outline">{statusLabels[status as keyof typeof statusLabels] || status}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle user query error
  if (userError) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Design Projects</h1>
          <p className="page-subtitle">View and manage all your assigned design projects</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Failed to load user information</h3>
              <p className="text-muted-foreground mt-2">{userError.message || "An unexpected error occurred. Please try again."}</p>
            </div>
            <button
              onClick={() => utils.portal.getCurrentUser.invalidate()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle projects query error
  if (projectsError) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Design Projects</h1>
          <p className="page-subtitle">View and manage all your assigned design projects</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Failed to load projects</h3>
              <p className="text-muted-foreground mt-2">{projectsError.message || "An unexpected error occurred. Please try again."}</p>
            </div>
            <button
              onClick={() => utils.portal.getDesignerProjects.invalidate()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Design Projects</h1>
        <p className="page-subtitle">View and manage all your assigned design projects</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="search"
            placeholder="Search by project name, description, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              All Projects ({filteredProjects.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No projects match your search' : 'No design projects assigned yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project: any) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/designer/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{project.project_name || 'Untitled Project'}</h3>
                        {getStatusBadge(project.current_stage)}
                      </div>
                      <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {formatDate(project.created_at)}</span>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
