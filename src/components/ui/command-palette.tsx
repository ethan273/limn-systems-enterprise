"use client";

/**
 * Command Palette Component
 *
 * Global search with Cmd+K hotkey
 * Fuzzy search across orders, clients, projects, tasks, and documents
 * Keyboard navigation and quick actions
 *
 * @module CommandPalette
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  FileText,
  Users,
  FolderKanban,
  CheckSquare,
  Package,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

interface SearchResult {
  id: string;
  type: 'order' | 'client' | 'project' | 'task' | 'document';
  title: string;
  subtitle?: string;
  href: string;
}

const RESULT_ICONS = {
  order: Package,
  client: Users,
  project: FolderKanban,
  task: CheckSquare,
  document: FileText,
};

const RESULT_LABELS = {
  order: 'Production Order',
  client: 'Client',
  project: 'Project',
  task: 'Task',
  document: 'Document',
};

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);

  // Search queries
  const { data: ordersData } = api.productionOrders.getAll.useQuery(
    {},
    { enabled: query.length > 0 }
  );

  const { data: clientsData } = api.clients.getAll.useQuery(
    {},
    { enabled: query.length > 0 }
  );

  const { data: projectsData } = api.projects.getAll.useQuery(
    {},
    { enabled: query.length > 0 }
  );

  const { data: tasksData } = api.tasks.getAll.useQuery(
    {},
    { enabled: query.length > 0 }
  );

  // Extract items from paginated responses
  const orders = ordersData?.items || [];
  const clients = clientsData?.items || [];
  const projects = projectsData?.items || [];
  const tasks = tasksData?.items || [];

  // Fuzzy search filter
  const fuzzyMatch = useCallback((text: string, search: string): boolean => {
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match
    if (textLower.includes(searchLower)) return true;

    // Fuzzy match (all characters in order)
    let searchIndex = 0;
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === searchLower.length;
  }, []);

  // Build search results
  const results: SearchResult[] = [];

  if (query.length > 0) {
    // Orders
    orders.forEach((order: any) => {
      const searchText = `${order.orderNumber || ''} ${order.itemName || ''}`;
      if (fuzzyMatch(searchText, query)) {
        results.push({
          id: order.id,
          type: 'order',
          title: order.orderNumber || 'Untitled Order',
          subtitle: order.itemName || undefined,
          href: `/production/orders/${order.id}`,
        });
      }
    });

    // Clients
    clients.forEach((client: any) => {
      const searchText = `${client.name || ''} ${client.company || ''}`;
      if (fuzzyMatch(searchText, query)) {
        results.push({
          id: client.id,
          type: 'client',
          title: client.name || 'Untitled Client',
          subtitle: client.company || undefined,
          href: `/crm/clients/${client.id}`,
        });
      }
    });

    // Projects
    projects.forEach((project: any) => {
      if (fuzzyMatch(project.name || '', query)) {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name || 'Untitled Project',
          subtitle: project.client?.name || undefined,
          href: `/crm/projects/${project.id}`,
        });
      }
    });

    // Tasks
    tasks.forEach((task: any) => {
      if (fuzzyMatch(task.title || '', query)) {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title || 'Untitled Task',
          subtitle: task.description || undefined,
          href: `/tasks/${task.id}`,
        });
      }
    });
  }

  // Keyboard shortcut to open (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Also listen for custom search event from keyboard shortcuts
  useEffect(() => {
    const handleSearchEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener('keyboard-shortcut-search', handleSearchEvent);
    return () => window.removeEventListener('keyboard-shortcut-search', handleSearchEvent);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          Math.min(prev + 1, results.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        // eslint-disable-next-line security/detect-object-injection
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        // eslint-disable-next-line security/detect-object-injection
        handleSelect(results[selectedIndex]!);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedIndex, results]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved) as SearchResult[]);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSelect = (result: SearchResult) => {
    // Add to recent searches
    const updated = [
      result,
      ...recentSearches.filter(r => r.id !== result.id)
    ].slice(0, 5); // Keep only 5 most recent

    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));

    // Navigate
    router.push(result.href);
    setIsOpen(false);
    setQuery('');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  };

  const displayResults = query.length > 0 ? results : recentSearches;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <div className="flex items-center border-b border-gray-700 px-3">
          <Search className="h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, clients, projects, tasks..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-700 bg-gray-800 px-1.5 font-mono text-xs text-gray-400">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-96">
          {displayResults.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {query.length > 0 ? (
                <div>
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p>No results found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div>
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p>Your recent searches will appear here</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-2">
              {query.length === 0 && recentSearches.length > 0 && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Recent Searches
                </div>
              )}

              {displayResults.map((result, index) => {
                // eslint-disable-next-line security/detect-object-injection
                const Icon = RESULT_ICONS[result.type];
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      isSelected
                        ? "bg-blue-500/10 border-l-2 border-blue-500"
                        : "hover:bg-gray-800/50 border-l-2 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md",
                      isSelected ? "bg-blue-500/20" : "bg-gray-800"
                    )}>
                      <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-200 truncate">
                          {result.title}
                        </span>
                        {/* eslint-disable-next-line security/detect-object-injection */}
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {RESULT_LABELS[result.type]}
                        </span>
                      </div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-400 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gray-700 px-3 py-2 text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded">ESC</kbd>
                Close
              </span>
            </div>
            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded">⌘K</kbd> to open
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
