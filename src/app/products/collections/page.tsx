"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Package, Users, Calendar, Settings, Plus, X } from "lucide-react";

interface Collection {
 id: string;
 name: string;
 prefix?: string;
 description?: string;
 image_url?: string;
 display_order?: number;
 is_active?: boolean;
 designer?: string;
 variation_types?: string[];
 created_at: string;
 updated_at?: string;
}

interface CollectionFormData {
 name: string;
 prefix: string;
 description: string;
 image_url: string;
 display_order: number;
 is_active: boolean;
 designer: string;
}

export default function CollectionsPage() {
 const [error, setError] = useState("");
 const [showCreateForm, setShowCreateForm] = useState(false);
 const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
 const [formData, setFormData] = useState<CollectionFormData>({
 name: "",
 prefix: "",
 description: "",
 image_url: "",
 display_order: 1,
 is_active: true,
 designer: ""
 });
 const [actionLoading, setActionLoading] = useState<string | null>(null);
 const [formErrors, setFormErrors] = useState<Record<string, string>>({});
 const [managingVariations, setManagingVariations] = useState<Collection | null>(null);
 const [newVariationType, setNewVariationType] = useState("");
 const [variationDialogOpen, setVariationDialogOpen] = useState(false);

 // Use tRPC API instead of manual fetch
 const { data: collections = [], isLoading: loading, refetch: fetchCollections } = api.products.getAllCollections.useQuery();
 const createCollectionMutation = api.products.createCollection.useMutation();
 const updateCollectionMutation = api.products.updateCollection.useMutation();
 const deleteCollectionMutation = api.products.deleteCollection.useMutation();

 const validateForm = () => {
 const errors: Record<string, string> = {};

 if (!(formData.name || "").trim()) {
 errors.name = "Collection name is required";
 }

 if (!(formData.prefix || "").trim()) {
 errors.prefix = "Prefix is required";
 } else if ((formData.prefix || []).length !== 2) {
 errors.prefix = "Prefix must be exactly 2 characters";
 } else if (!/^[A-Z]{2}$/.test(formData.prefix)) {
 errors.prefix = "Prefix must be 2 uppercase letters";
 }

 // Check for duplicate prefix
 const existingPrefixes = collections
 .filter((c: any) => c.id !== editingCollection?.id)
 .map((c: any) => c.prefix?.toUpperCase()).filter(Boolean);

 if (existingPrefixes.includes((formData.prefix || "").toUpperCase())) {
 errors.prefix = "This prefix is already in use";
 }

 if (formData.display_order < 1) {
 errors.display_order = "Display order must be at least 1";
 }

 setFormErrors(errors);
 return Object.keys(errors).length === 0;
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!validateForm()) {
 return;
 }

 const isEditing = !!editingCollection;
 setActionLoading(isEditing ? "update" : "create");

 try {
 if (isEditing) {
 await updateCollectionMutation.mutateAsync({
 id: editingCollection.id,
 name: formData.name,
 description: formData.description || undefined,
 });
 } else {
 await createCollectionMutation.mutateAsync({
 name: formData.name,
 description: formData.description || undefined,
 });
 }

 toast({
 title: "Success",
 description: `Collection ${isEditing ? "updated" : "created"} successfully!`,
 });
 setShowCreateForm(false);
 setEditingCollection(null);
 resetForm();
 await fetchCollections();
 setError("");
 } catch (err) {
 const errorMessage = `Failed to ${isEditing ? "update" : "create"} collection`;
 setError(errorMessage);
 toast({
 title: "Error",
 description: errorMessage,
 variant: "destructive",
 });
 } finally {
 setActionLoading(null);
 }
 };

 const handleEdit = (collection: any) => {
 setEditingCollection(collection);
 setFormData({
 name: collection.name,
 prefix: collection.prefix || "",
 description: collection.description || "",
 image_url: collection.image_url || "",
 display_order: collection.display_order || 1,
 is_active: collection.is_active !== false,
 designer: collection.designer || ""
 });
 setFormErrors({});
 setShowCreateForm(true);
 setError("");
 };

 const handleDelete = async (collection: any) => {
 if (!confirm(`Are you sure you want to delete "${collection.name}"? This action cannot be undone.`)) {
 return;
 }

 setActionLoading(`delete-${collection.id}`);

 try {
 await deleteCollectionMutation.mutateAsync({ id: collection.id });

 toast({
 title: "Success",
 description: "Collection deleted successfully!",
 });
 await fetchCollections();
 setError("");
 } catch (err) {
 const errorMessage = "Failed to delete collection";
 setError(errorMessage);
 toast({
 title: "Error",
 description: errorMessage,
 variant: "destructive",
 });
 } finally {
 setActionLoading(null);
 }
 };

 const resetForm = () => {
 setFormData({
 name: "",
 prefix: "",
 description: "",
 image_url: "",
 display_order: Math.max(1, collections.length + 1),
 is_active: true,
 designer: ""
 });
 setFormErrors({});
 };

 const handleCancel = () => {
 setShowCreateForm(false);
 setEditingCollection(null);
 resetForm();
 setError("");
 };

 const formatDate = (dateString: string) => {
 return new Date(dateString).toLocaleDateString("en-US", {
 year: "numeric",
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit"
 });
 };

 const handleManageVariations = (collection: any) => {
 setManagingVariations(collection);
 setVariationDialogOpen(true);
 setNewVariationType("");
 };

 const handleAddVariationType = () => {
 if (!newVariationType.trim() || !managingVariations) return;

 const currentTypes = managingVariations.variation_types || [];
 if (currentTypes.includes(newVariationType.trim())) {
 toast({
 title: "Error",
 description: "This variation type already exists",
 variant: "destructive",
 });
 return;
 }

 const updatedTypes = [...currentTypes, newVariationType.trim()];
 updateCollectionVariations(managingVariations.id, updatedTypes);
 setNewVariationType("");
 };

 const handleRemoveVariationType = (typeToRemove: string) => {
 if (!managingVariations) return;

 const updatedTypes = (managingVariations.variation_types || []).filter(type => type !== typeToRemove);
 updateCollectionVariations(managingVariations.id, updatedTypes);
 };

 const updateCollectionVariations = async (collectionId: string, variationTypes: string[]) => {
 try {
 // Note: This will need a new API endpoint to update variation_types
 // For now, we'll update the local state
 setManagingVariations(prev => prev ? { ...prev, variation_types: variationTypes } : null);

 toast({
 title: "Success",
 description: "Variation types updated successfully",
 });

 // Refresh collections to get updated data
 await fetchCollections();
 } catch (err) {
 toast({
 title: "Error",
 description: "Failed to update variation types",
 variant: "destructive",
 });
 }
 };

 return (
 <div className="p-6 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-bold text-primary">Collections</h1>
 <p className="text-secondary mt-1">Manage product collections and their properties</p>
 </div>
 <div className="flex space-x-2">
 <Button onClick={() => fetchCollections()} disabled={loading} variant="outline">
 {loading ? "Refreshing..." : "Refresh"}
 </Button>
 <Button
 onClick={() => {
 resetForm();
 setShowCreateForm(true);
 setError("");
 }}
 disabled={showCreateForm}
 >
 New Collection
 </Button>
 </div>
 </div>

 {error && (
 <div className="bg-red-900/20 border border-red-500 rounded-md p-4">
 <div className="text-red-300 text-sm">
 <strong>Error:</strong> {error}
 </div>
 </div>
 )}

 {/* Create/Edit Form */}
 {showCreateForm && (
 <Card className="card">
 <CardHeader>
 <CardTitle className="text-primary">
 {editingCollection ? "Edit Collection" : "Create New Collection"}
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 <form onSubmit={handleSubmit} className="space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Basic Information */}
 <div className="space-y-4">
 <h3 className="font-medium text-primary">Basic Information</h3>

 <div>
 <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
 Collection Name *
 </label>
 <input
 id="name"
 type="text"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 className={`w-full px-3 py-2 card border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-primary ${
 formErrors.name ? 'border-red-500' : ''
 }`}
 placeholder="e.g., Pacifica Collection"
 />
 {formErrors.name && (
 <div className="text-red-400 text-sm mt-1">{formErrors.name}</div>
 )}
 </div>

 <div>
 <label htmlFor="description" className="block text-sm font-medium text-primary mb-1">
 Description
 </label>
 <textarea
 id="description"
 rows={3}
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full px-3 py-2 card border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-primary"
 placeholder="Describe this collection..."
 />
 </div>
 </div>

 {/* Settings */}
 <div className="space-y-4">
 <h3 className="font-medium text-primary">Settings</h3>

 <div className="flex items-center space-x-2">
 <input
 id="is_active"
 type="checkbox"
 checked={formData.is_active}
 onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
 className="h-4 w-4 text-primary focus:ring-primary card rounded"
 />
 <label htmlFor="is_active" className="text-sm font-medium text-primary">
 Active Collection
 </label>
 </div>
 </div>
 </div>

 {/* Form Actions */}
 <div className="flex justify-end space-x-4 pt-6 border-t">
 <Button
 type="button"
 variant="outline"
 onClick={handleCancel}
 disabled={!!actionLoading}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 disabled={!!actionLoading}
 className="min-w-[120px]"
 >
 {actionLoading === "create" || actionLoading === "update" ? (
 <div className="flex items-center space-x-2">
 <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
 <span>{editingCollection ? "Updating..." : "Creating..."}</span>
 </div>
 ) : (
 editingCollection ? "Update Collection" : "Create Collection"
 )}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 )}

 {/* Collections Table */}
 <Card className="card">
 <CardHeader>
 <CardTitle className="text-primary">All Collections ({collections.length})</CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 {loading ? (
 <div className="text-center py-12">
 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4"></div>
 <div className="page-subtitle">Loading collections...</div>
 </div>
 ) : collections.length === 0 ? (
 <div className="text-center py-12">
 <div className="text-secondary mb-4">No collections found</div>
 <Button onClick={() => {
 resetForm();
 setShowCreateForm(true);
 }}>
 Create First Collection
 </Button>
 </div>
 ) : (
 <Accordion type="multiple" className="space-y-2">
 {collections.map((collection: any, index: number) => (
 <AccordionItem
 key={`collections-accordion-${index}-${collection.id || "no-id"}`}
 value={collection.id}
 className="border rounded-lg card"
 >
 <AccordionTrigger className="px-6 py-4 hover:no-underline">
 <div className="flex items-center justify-between w-full">
 <div className="flex items-center space-x-4">
 <div className="text-left">
 <div className="font-medium text-primary">{collection.name}</div>
 <div className="text-sm text-secondary mt-1">
 {collection.description || "No description provided"}
 </div>
 </div>
 {collection.prefix && (
 <Badge variant="secondary" className="font-mono">
 {collection.prefix}
 </Badge>
 )}
 </div>
 <div className="flex items-center space-x-3">
 <Badge
 variant={collection.is_active !== false ? "default" : "secondary"}
 className={collection.is_active !== false ? "bg-green-100 text-green-800" : "badge-neutral"}
 >
 {collection.is_active !== false ? "Active" : "Inactive"}
 </Badge>
 <div className="text-sm page-subtitle">
 {formatDate(collection.created_at)}
 </div>
 </div>
 </div>
 </AccordionTrigger>
 <AccordionContent className="px-6 pb-4">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
 {/* Collection Details */}
 <div className="space-y-3">
 <h4 className="font-medium text-primary flex items-center gap-2">
 <Package className="h-4 w-4" />
 Collection Details
 </h4>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="page-subtitle">Prefix:</span>
 <span className="font-mono text-primary">{collection.prefix || "—"}</span>
 </div>
 <div className="flex justify-between">
 <span className="page-subtitle">Display Order:</span>
 <span className="text-primary">{collection.display_order || "—"}</span>
 </div>
 <div className="flex justify-between">
 <span className="page-subtitle">Designer:</span>
 <span className="text-primary">{collection.designer || "—"}</span>
 </div>
 </div>
 </div>

 {/* Statistics */}
 <div className="space-y-3">
 <h4 className="font-medium text-primary flex items-center gap-2">
 <Users className="h-4 w-4" />
 Statistics
 </h4>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="page-subtitle">Items Count:</span>
 <Badge variant="outline" className=" text-secondary">0 items</Badge>
 </div>
 <div className="flex justify-between">
 <span className="page-subtitle">Materials Tagged:</span>
 <Badge variant="outline" className=" text-secondary">0 materials</Badge>
 </div>
 <div className="flex justify-between">
 <span className="page-subtitle">Active Orders:</span>
 <Badge variant="outline" className=" text-secondary">0 orders</Badge>
 </div>
 </div>
 </div>

 {/* Variations */}
 <div className="space-y-3">
 <h4 className="font-medium text-primary flex items-center gap-2">
 <Settings className="h-4 w-4" />
 Variation Types
 </h4>
 <div className="space-y-2">
 {collection.variation_types && collection.variation_types.length > 0 ? (
 <div className="flex flex-wrap gap-1">
 {collection.variation_types.map((type: string, idx: number) => (
 <Badge key={idx} variant="outline" className=" text-secondary text-xs">
 {type}
 </Badge>
 ))}
 </div>
 ) : (
 <div className="text-sm page-subtitle">No variation types defined</div>
 )}
 <Dialog open={variationDialogOpen} onOpenChange={setVariationDialogOpen}>
 <DialogTrigger asChild>
 <Button
 size="sm"
 variant="outline"
 onClick={() => handleManageVariations(collection)}
 className="w-full mt-2 text-xs text-secondary hover:card"
 >
 <Settings className="h-3 w-3 mr-1" />
 Manage Variations
 </Button>
 </DialogTrigger>
 <DialogContent className="card text-primary">
 <DialogHeader>
 <DialogTitle className="text-primary">
 Manage Variation Types - {managingVariations?.name}
 </DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-medium text-primary">Current Variation Types:</label>
 {managingVariations?.variation_types && managingVariations.variation_types.length > 0 ? (
 <div className="flex flex-wrap gap-2">
 {managingVariations.variation_types.map((type, idx) => (
 <div key={idx} className="flex items-center card border rounded-md px-2 py-1">
 <span className="text-sm text-primary">{type}</span>
 <button
 onClick={() => handleRemoveVariationType(type)}
 className="ml-2 text-red-400 hover:text-red-300"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-sm page-subtitle">No variation types defined</div>
 )}
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-primary">Add New Variation Type:</label>
 <div className="flex gap-2">
 <Input
 value={newVariationType}
 onChange={(e) => setNewVariationType(e.target.value)}
 placeholder="e.g., Standard, Deep, Custom"
 className="card text-primary"
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleAddVariationType();
 }
 }}
 />
 <Button
 onClick={handleAddVariationType}
 disabled={!newVariationType.trim()}
 size="sm"
 >
 <Plus className="h-4 w-4" />
 </Button>
 </div>
 </div>
 <div className="text-xs page-subtitle">
 Variation types help categorize different versions of items within this collection (e.g., Standard vs Deep seating, different sizes, etc.)
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 </div>
 </div>

 {/* Description */}
 {collection.description && (
 <div className="mb-6">
 <h4 className="font-medium text-primary mb-2">Description</h4>
 <p className="text-sm text-secondary card border rounded-md p-3">
 {collection.description}
 </p>
 </div>
 )}

 {/* Image */}
 {collection.image_url && (
 <div className="mb-6">
 <h4 className="font-medium text-primary mb-2">Collection Image</h4>
 <div className="relative w-32 h-32 rounded-md overflow-hidden card border">
 <Image
 src={collection.image_url}
 alt={collection.name}
 fill
 className="object-cover"
 />
 </div>
 </div>
 )}

 {/* Timeline */}
 <div className="mb-6">
 <h4 className="font-medium text-primary flex items-center gap-2 mb-3">
 <Calendar className="h-4 w-4" />
 Timeline
 </h4>
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div className="flex justify-between">
 <span className="page-subtitle">Created:</span>
 <span className="text-primary">{formatDate(collection.created_at)}</span>
 </div>
 {collection.updated_at && (
 <div className="flex justify-between">
 <span className="page-subtitle">Updated:</span>
 <span className="text-primary">{formatDate(collection.updated_at)}</span>
 </div>
 )}
 <div className="flex justify-between">
 <span className="page-subtitle">Status:</span>
 <Badge
 variant={collection.is_active !== false ? "default" : "secondary"}
 className={collection.is_active !== false ? "bg-green-600 text-green-100" : " text-secondary"}
 >
 {collection.is_active !== false ? "Active" : "Inactive"}
 </Badge>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex justify-end space-x-2 pt-4 border-t">
 <Button
 size="sm"
 variant="outline"
 onClick={() => handleEdit(collection)}
 disabled={!!actionLoading}
 >
 Edit Collection
 </Button>
 <Button
 size="sm"
 variant="outline"
 onClick={() => handleDelete(collection)}
 disabled={!!actionLoading}
 className="text-red-600 hover:text-red-700 hover:bg-red-50"
 >
 {actionLoading === `delete-${collection.id}` ? (
 <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
 ) : (
 "Delete Collection"
 )}
 </Button>
 </div>
 </AccordionContent>
 </AccordionItem>
 ))}
 </Accordion>
 )}
 </CardContent>
 </Card>
 </div>
 );
}