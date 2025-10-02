"use client";

import React, { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Trash2, ZoomIn, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface QCPhotoGalleryProps {
 inspectionId: string;
 photos: any[];
 onUpdate: () => void;
}

export function QCPhotoGallery({ photos, onUpdate }: QCPhotoGalleryProps) {
 const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

 // Delete photo mutation
 const deletePhotoMutation = api.qc.deletePhoto.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Photo deleted successfully",
 });
 setSelectedPhoto(null);
 onUpdate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to delete photo",
 variant: "destructive",
 });
 },
 });

 const handleDelete = (photoId: string) => {
 if (confirm("Are you sure you want to delete this photo?")) {
 deletePhotoMutation.mutate({ id: photoId });
 }
 };

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold">QC Photos</h3>
 <Button>
 <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
 Upload Photo
 </Button>
 </div>

 {/* Photo Grid */}
 {photos.length === 0 ? (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm mb-4">No photos available</p>
 <Button variant="outline">
 <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
 Upload First Photo
 </Button>
 </div>
 </CardContent>
 </Card>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {photos.map((photo) => (
 <Card key={photo.id} className="overflow-hidden group">
 <CardContent className="p-0">
 <div className="relative aspect-square bg-muted">
 <Image
 src={photo.photo_url}
 alt={photo.caption || "QC inspection photo"}
 fill
 className="object-cover"
 />
 {/* Hover Overlay */}
 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
 <Button
 size="sm"
 variant="secondary"
 onClick={() => setSelectedPhoto(photo)}
 >
 <ZoomIn className="w-4 h-4" aria-hidden="true" />
 </Button>
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
 {photo.caption && (
 <div className="p-3">
 <p className="text-sm line-clamp-2">{photo.caption}</p>
 </div>
 )}
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 {/* Photo Detail Dialog */}
 {selectedPhoto && (
 <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
 <DialogContent className="max-w-4xl">
 <DialogHeader>
 <DialogTitle>Photo Details</DialogTitle>
 {selectedPhoto.caption && (
 <DialogDescription>{selectedPhoto.caption}</DialogDescription>
 )}
 </DialogHeader>
 <div className="space-y-4">
 {/* Photo */}
 <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
 <Image
 src={selectedPhoto.photo_url}
 alt={selectedPhoto.caption || "QC inspection photo"}
 fill
 className="object-contain"
 />
 </div>
 {/* Metadata */}
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-muted-foreground">Uploaded:</span>{" "}
 <span className="ml-2">
 {format(new Date(selectedPhoto.created_at), "MMM d, yyyy h:mm a")}
 </span>
 </div>
 </div>
 {/* Actions */}
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 asChild
 >
 <a href={selectedPhoto.photo_url} target="_blank" rel="noopener noreferrer">
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
