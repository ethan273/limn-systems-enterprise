"use client";

import React, { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 ImageIcon,
 Star,
 Trash2,
 ZoomIn,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PhotoUploadDialog } from "./PhotoUploadDialog";

interface PhotoGalleryProps {
 prototypeId: string;
 milestoneId?: string;
}

export function PhotoGallery({ prototypeId, milestoneId }: PhotoGalleryProps) {
 const [photoTypeFilter, setPhotoTypeFilter] = useState<string>("all");
 const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

 // Fetch photos
 const {
 data: photos,
 isLoading,
 refetch,
 } = api.prototypes.getPhotos.useQuery({
 prototypeId,
 milestoneId,
 photoType: photoTypeFilter === "all" ? undefined : photoTypeFilter,
 });

 // Delete photo mutation
 const deletePhotoMutation = api.prototypes.deletePhoto.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Photo deleted successfully",
 });
 refetch();
 setSelectedPhoto(null);
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to delete photo",
 variant: "destructive",
 });
 },
 });

 // Set featured photo mutation
 const setFeaturedMutation = api.prototypes.setFeaturedPhoto.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Featured photo updated",
 });
 refetch();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to set featured photo",
 variant: "destructive",
 });
 },
 });

 const handleDelete = (photoId: string) => {
 if (confirm("Are you sure you want to delete this photo?")) {
 deletePhotoMutation.mutate({ id: photoId });
 }
 };

 const handleSetFeatured = (photoId: string) => {
 setFeaturedMutation.mutate({ prototypeId, photoId });
 };

 const photoTypeOptions = [
 { value: "all", label: "All Photos" },
 { value: "progress", label: "Progress" },
 { value: "issue", label: "Issue" },
 { value: "detail", label: "Detail" },
 { value: "comparison", label: "Comparison" },
 { value: "final", label: "Final" },
 { value: "defect", label: "Defect" },
 ];

 return (
 <div className="space-y-4">
 {/* Header with Upload and Filter */}
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <Select value={photoTypeFilter} onValueChange={setPhotoTypeFilter}>
 <SelectTrigger className="w-[200px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {photoTypeOptions.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {photos && photos.length > 0 && (
 <span className="text-sm text-muted-foreground">
 {photos.length} {photos.length === 1 ? "photo" : "photos"}
 </span>
 )}
 </div>
 <PhotoUploadDialog
 prototypeId={prototypeId}
 milestoneId={milestoneId}
 onSuccess={refetch}
 />
 </div>

 {/* Photo Grid */}
 {isLoading ? (
 <div className="text-center py-12 text-muted-foreground">
 Loading photos...
 </div>
 ) : photos && photos.length > 0 ? (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {photos.map((photo) => (
 <Card key={photo.id} className="overflow-hidden group">
 <CardContent className="p-0">
 <div className="relative aspect-square bg-muted">
 <Image
 src={photo.file_url}
 alt={photo.title || photo.description || "Prototype photo"}
 fill
 className="object-cover"
 />
 {/* Featured Badge */}
 {photo.is_featured && (
 <Badge className="absolute top-2 right-2 bg-warning">
 <Star className="w-3 h-3 mr-1" aria-hidden="true" />
 Featured
 </Badge>
 )}
 {/* Hover Overlay */}
 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
 <Button
 size="sm"
 variant="secondary"
 onClick={() => setSelectedPhoto(photo)}
 >
 <ZoomIn className="w-4 h-4" aria-hidden="true" />
 </Button>
 {!photo.is_featured && (
 <Button
 size="sm"
 variant="secondary"
 onClick={() => handleSetFeatured(photo.id)}
 disabled={setFeaturedMutation.isPending}
 >
 <Star className="w-4 h-4" aria-hidden="true" />
 </Button>
 )}
 <Button
 size="sm"
 variant="destructive"
 onClick={() => handleDelete(photo.id)}
 disabled={deletePhotoMutation.isPending}
 >
 <Trash2 className="w-4 h-4" aria-hidden="true" />
 </Button>
 </div>
 </div>
 {/* Photo Info */}
 <div className="p-3 space-y-2">
 <div className="flex items-center gap-2">
 <Badge variant="outline" className="text-xs capitalize">
 {photo.photo_type.replace("_", " ")}
 </Badge>
 </div>
 {photo.title && (
 <p className="text-sm font-medium line-clamp-1">{photo.title}</p>
 )}
 {photo.description && (
 <p className="text-xs text-muted-foreground line-clamp-2">
 {photo.description}
 </p>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm mb-4">No photos available</p>
 <PhotoUploadDialog
 prototypeId={prototypeId}
 milestoneId={milestoneId}
 onSuccess={refetch}
 trigger={
 <Button variant="outline">
 <ImageIcon className="w-4 h-4 mr-2" aria-hidden="true" />
 Upload First Photo
 </Button>
 }
 />
 </div>
 </CardContent>
 </Card>
 )}

 {/* Photo Detail Dialog */}
 {selectedPhoto && (
 <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
 <DialogContent className="max-w-4xl">
 <DialogHeader>
 <DialogTitle>{selectedPhoto.title || "Photo Details"}</DialogTitle>
 {selectedPhoto.description && (
 <DialogDescription>{selectedPhoto.description}</DialogDescription>
 )}
 </DialogHeader>
 <div className="space-y-4">
 {/* Photo */}
 <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
 <Image
 src={selectedPhoto.file_url}
 alt={selectedPhoto.title || selectedPhoto.description || "Prototype photo"}
 fill
 className="object-contain"
 />
 </div>
 {/* Metadata */}
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-muted-foreground">Type:</span>{" "}
 <Badge variant="outline" className="ml-2 capitalize">
 {selectedPhoto.photo_type.replace("_", " ")}
 </Badge>
 </div>
 <div>
 <span className="text-muted-foreground">Featured:</span>{" "}
 {selectedPhoto.is_featured ? (
 <Badge className="ml-2 bg-warning">Yes</Badge>
 ) : (
 <span className="ml-2">No</span>
 )}
 </div>
 {selectedPhoto.uploaded_by && (
 <div>
 <span className="text-muted-foreground">Uploaded By:</span>{" "}
 <span className="ml-2">{selectedPhoto.uploaded_by.email || "—"}</span>
 </div>
 )}
 <div>
 <span className="text-muted-foreground">Uploaded:</span>{" "}
 <span className="ml-2">
 {new Date(selectedPhoto.created_at).toLocaleDateString()}
 </span>
 </div>
 </div>
 {/* Actions */}
 <div className="flex items-center gap-2">
 {!selectedPhoto.is_featured && (
 <Button
 variant="outline"
 onClick={() => handleSetFeatured(selectedPhoto.id)}
 disabled={setFeaturedMutation.isPending}
 >
 <Star className="w-4 h-4 mr-2" aria-hidden="true" />
 Set as Featured
 </Button>
 )}
 <Button
 variant="outline"
 asChild
 >
 <a href={selectedPhoto.file_url} target="_blank" rel="noopener noreferrer">
 Open Original
 </a>
 </Button>
 <Button
 variant="destructive"
 onClick={() => handleDelete(selectedPhoto.id)}
 disabled={deletePhotoMutation.isPending}
 className="ml-auto"
 >
 <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
 Delete Photo
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 )}
 </div>
 );
}
