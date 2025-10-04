"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Package, MoreVertical, Eye, Edit, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PrototypesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Query items filtered by prototype status
  const { data, isLoading } = api.items.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  const items = data?.items || [];

  // Filter to only show prototype items
  const prototypeItems = items.filter((item: any) =>
    item.status === 'prototype' || item.type === 'Prototype'
  );

  // Further filter by search query
  const filteredItems = prototypeItems.filter((item: any) => {
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
          <h1 className="page-title">Prototypes</h1>
          <p className="page-subtitle">Physical prototypes in testing</p>
        </div>
        <Button onClick={() => router.push('/products/prototypes/new')}>
          <Plus className="icon-sm" />
          New Prototype
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search prototypes by name, SKU, or collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-muted/20 rounded-lg">
                <Package className="h-5 w-5 text-info" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm page-subtitle">Total Prototypes</p>
                <p className="text-xl font-bold text-primary">{prototypeItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-muted/20 rounded-lg">
                <Package className="h-5 w-5 text-success" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm page-subtitle">Active</p>
                <p className="text-xl font-bold text-primary">
                  {prototypeItems.filter((item: any) => item.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted/20 rounded-lg">
                <Package className="h-5 w-5 text-muted" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm page-subtitle">Inactive</p>
                <p className="text-xl font-bold text-primary">
                  {prototypeItems.filter((item: any) => !item.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  <p className="page-subtitle mt-2">Loading prototypes...</p>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="page-subtitle">
                    {searchQuery ? "No prototypes found matching your search" : "No prototypes found"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => router.push('/products/prototypes/new')}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="icon-sm" />
                      Create First Prototype
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
