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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, MoreVertical, Eye, Edit, Trash, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Collection {
  id: string;
  name: string;
  prefix?: string;
  description?: string;
  designer?: string;
  display_order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Query collections
  const { data: collections = [], isLoading, refetch } = api.products.getAllCollections.useQuery();

  // Mutations
  const createMutation = api.products.createCollection.useMutation();
  const updateMutation = api.products.updateCollection.useMutation();
  const deleteMutation = api.products.deleteCollection.useMutation();

  // Filter collections by search query
  const filteredCollections = collections.filter((collection: Collection) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      collection.prefix?.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    );
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
      });

      toast({
        title: "Success",
        description: "Collection created successfully",
      });

      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingCollection || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingCollection.id,
        name: formData.name,
        description: formData.description || undefined,
      });

      toast({
        title: "Success",
        description: "Collection updated successfully",
      });

      setShowEditDialog(false);
      setEditingCollection(null);
      setFormData({ name: "", description: "" });
      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update collection",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the collection "${name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });

      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">Manage product collections and their properties</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="icon-sm" />
          New Collection
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search collections by name, prefix, or description..."
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
                <p className="text-sm page-subtitle">Total Collections</p>
                <p className="text-xl font-bold text-primary">{collections.length}</p>
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
                  {collections.filter((c: Collection) => c.is_active !== false).length}
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
                  {collections.filter((c: Collection) => c.is_active === false).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Table */}
      <div className="data-table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Designer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="loading-spinner" />
                  <p className="page-subtitle mt-2">Loading collections...</p>
                </TableCell>
              </TableRow>
            ) : filteredCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="page-subtitle">
                    {searchQuery ? "No collections found matching your search" : "No collections found"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="icon-sm" />
                      Create First Collection
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.map((collection: Collection) => (
                <TableRow
                  key={collection.id}
                  className="data-table-row"
                  onClick={() => router.push(`/products/collections/${collection.id}`)}
                >
                  <TableCell className="data-table-cell-primary">
                    <div className="flex items-center gap-3">
                      <div className="data-table-avatar">
                        <Package className="icon-sm" />
                      </div>
                      <span className="font-medium">{collection.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    {collection.prefix ? (
                      <Badge variant="secondary" className="font-mono">
                        {collection.prefix}
                      </Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="data-table-cell">
                    <span className="line-clamp-1">
                      {collection.description || <span className="text-muted">—</span>}
                    </span>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    {collection.designer || <span className="text-muted">—</span>}
                  </TableCell>
                  <TableCell className="data-table-cell">
                    <Badge
                      variant="outline"
                      className={
                        collection.is_active !== false
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {collection.is_active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="data-table-cell">
                    {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
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
                            router.push(`/products/collections/${collection.id}`);
                          }}
                        >
                          <Eye className="icon-sm" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(collection);
                          }}
                        >
                          <Edit className="icon-sm" />
                          Edit Collection
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="dropdown-item-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(collection.id, collection.name);
                          }}
                        >
                          <Trash className="icon-sm" />
                          Delete Collection
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="card">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Pacifica Collection"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this collection..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setFormData({ name: "", description: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="card">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Collection Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Pacifica Collection"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this collection..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingCollection(null);
                setFormData({ name: "", description: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
