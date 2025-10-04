"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Package, MoreVertical, Eye, Edit, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ConceptsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Query items filtered by concept status
  const { data, isLoading } = api.items.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  const items = data?.items || [];

  // Filter to only show concept items
  const conceptItems = items.filter((item: any) =>
    item.status === 'concept' || item.type === 'Concept'
  );

  // Further filter by search query
  const filteredItems = conceptItems.filter((item: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.base_sku?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.collections?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Concepts</h1>
          <p className="page-subtitle">Design concepts in development</p>
        </div>
        <Button onClick={() => router.push('/products/concepts/new')}>
          <Plus className="icon-sm" />
          New Concept
        </Button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="relative flex-1">
          <Search className="search-icon" />
          <Input
            placeholder="Search concepts by name, SKU, or collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <span className="stat-card-label">Total Concepts</span>
              <Package className="stat-card-icon" />
            </div>
            <div className="stat-card-value">{conceptItems.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <span className="stat-card-label">Active</span>
              <Package className="stat-card-icon" />
            </div>
            <div className="stat-card-value">
              {conceptItems.filter((item: any) => item.is_active).length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <span className="stat-card-label">Inactive</span>
              <Package className="stat-card-icon" />
            </div>
            <div className="stat-card-value">
              {conceptItems.filter((item: any) => !item.is_active).length}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="data-table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Base SKU</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="loading-spinner" />
                  <p className="page-subtitle mt-2">Loading concepts...</p>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="page-subtitle">
                    {searchQuery ? "No concepts found matching your search" : "No concepts found"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => router.push('/products/concepts/new')}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="icon-sm" />
                      Create First Concept
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item: any) => (
                <TableRow
                  key={item.id}
                  className="data-table-row"
                  onClick={() => router.push(`/products/catalog/${item.id}`)}
                >
                  <TableCell className="data-table-cell-primary">
                    <div className="flex items-center gap-3">
                      <div className="data-table-avatar">
                        <Package className="icon-sm" />
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-secondary line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    <Badge variant="secondary" className="font-mono">
                      {item.base_sku}
                    </Badge>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    <Badge variant="outline">
                      {item.collections?.name || 'No collection'}
                    </Badge>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    {item.furniture_type ? (
                      <Badge variant="secondary" className="capitalize">
                        {item.furniture_type.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="data-table-cell">
                    <span className="font-medium">
                      ${item.list_price ? item.list_price.toFixed(2) : '0.00'}
                    </span>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    <Badge
                      variant="outline"
                      className={
                        item.is_active
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    {item.created_at && formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="data-table-cell-actions">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="btn-icon">
                          <MoreVertical className="icon-sm" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="card">
                        <DropdownMenuItem
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/catalog/${item.id}`);
                          }}
                        >
                          <Eye className="icon-sm" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/catalog/${item.id}/edit`);
                          }}
                        >
                          <Edit className="icon-sm" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="dropdown-item-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Add delete handler
                          }}
                        >
                          <Trash className="icon-sm" />
                          Delete Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
