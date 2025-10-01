"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit,
  Eye,
  Plus,
  FileImage,
  Box,
  Camera,
  Layers
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export type ImageType = 'line_drawing' | 'isometric' | '3d_model' | 'rendering' | 'photograph';

export interface ItemImage {
  id: string;
  item_id: string;
  image_type: ImageType;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  alt_text?: string;
  description?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

interface ImageManagerProps {
  images: Record<ImageType, ItemImage[]>;
  onUpload: (_imageType: ImageType, _file: File, _metadata: Partial<ItemImage>) => Promise<void>;
  onUpdate: (_imageId: string, _metadata: Partial<ItemImage>) => Promise<void>;
  onDelete: (_imageId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const IMAGE_TYPE_CONFIG: Record<ImageType, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  maxCount: number;
  acceptedTypes: string[];
}> = {
  line_drawing: {
    label: 'Line Drawing',
    description: 'Technical line drawing or blueprint',
    icon: FileImage,
    maxCount: 1,
    acceptedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
  isometric: {
    label: 'Isometric',
    description: '3D isometric perspective drawing',
    icon: Box,
    maxCount: 1,
    acceptedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
  '3d_model': {
    label: '3D Model',
    description: '3D model file or rendered view',
    icon: Layers,
    maxCount: 1,
    acceptedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
  rendering: {
    label: 'Renderings',
    description: 'Computer-generated renderings',
    icon: ImageIcon,
    maxCount: 10,
    acceptedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
  photograph: {
    label: 'Photographs',
    description: 'Real photographs of the item',
    icon: Camera,
    maxCount: 20,
    acceptedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
};

export function ImageManager({
  images,
  onUpload,
  onUpdate,
  onDelete,
  disabled = false,
  className,
}: ImageManagerProps) {
  const [uploadingType, setUploadingType] = useState<ImageType | null>(null);
  const [editingImage, setEditingImage] = useState<ItemImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<ItemImage | null>(null);
  const [previewImage, setPreviewImage] = useState<ItemImage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (imageType: ImageType) => {
    // eslint-disable-next-line security/detect-object-injection
    const config = IMAGE_TYPE_CONFIG[imageType as keyof typeof IMAGE_TYPE_CONFIG];
    // eslint-disable-next-line security/detect-object-injection
    const currentCount = images[imageType]?.length || 0;

    if (currentCount >= config.maxCount) {
      toast({
        title: 'Upload Limit Reached',
        description: `Maximum ${config.maxCount} ${config.label.toLowerCase()} allowed`,
        variant: 'destructive',
      });
      return;
    }

    setUploadingType(imageType);
    if (fileInputRef.current) {
      fileInputRef.current.accept = config.acceptedTypes.join(',');
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadingType || !event.target.files?.length) return;

    const file = event.target.files[0];
    const config = IMAGE_TYPE_CONFIG[uploadingType as keyof typeof IMAGE_TYPE_CONFIG];

    // Validate file type
    if (!config.acceptedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: `Please select a valid file type: ${config.acceptedTypes.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      // For demonstration, we'll simulate upload progress
      // In real implementation, this would be handled by the upload service
      const uploadSimulation = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[file.name] || 0;
          if (current >= 100) {
            clearInterval(uploadSimulation);
            return prev;
          }
          return { ...prev, [file.name]: current + 10 };
        });
      }, 100);

      await onUpload(uploadingType, file, {
        alt_text: file.name.replace(/\.[^/.]+$/, ''),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });

      clearInterval(uploadSimulation);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });

      toast({
        title: 'Upload Successful',
        description: `${config.label} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = async (imageId: string, updates: Partial<ItemImage>) => {
    try {
      await onUpdate(imageId, updates);
      setEditingImage(null);
      toast({
        title: 'Image Updated',
        description: 'Image metadata updated successfully',
      });
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingImage) return;

    try {
      await onDelete(deletingImage.id);
      setDeletingImage(null);
      toast({
        title: 'Image Deleted',
        description: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderImageCard = (image: ItemImage, imageType: ImageType) => {
    const config = IMAGE_TYPE_CONFIG[imageType as keyof typeof IMAGE_TYPE_CONFIG];

    return (
      <div
        key={image.id}
        className="relative group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
      >
        {/* Image Preview */}
        <div className="aspect-square bg-gray-900 flex items-center justify-center relative">
          {image.file_url ? (
            <Image
              src={image.file_url}
              alt={image.alt_text || image.file_name || 'Item image'}
              className="w-full h-full object-cover"
              width={200}
              height={200}
            />
          ) : null}
          <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-800">
            <config.icon className="h-8 w-8 text-gray-400" />
          </div>

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setPreviewImage(image)}
              disabled={disabled}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setEditingImage(image)}
              disabled={disabled}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setDeletingImage(image)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Primary Badge */}
          {image.is_primary && (
            <Badge className="absolute top-2 left-2 bg-blue-600 text-blue-100">
              Primary
            </Badge>
          )}
        </div>

        {/* Image Info */}
        <div className="p-3">
          <div className="text-sm font-medium text-gray-200 truncate">
            {image.file_name || 'Untitled'}
          </div>
          {image.description && (
            <div className="text-xs text-gray-400 truncate mt-1">
              {image.description}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {image.file_size ? `${(image.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
          </div>
        </div>
      </div>
    );
  };

  const renderImageTypeSection = (imageType: ImageType) => {
    // eslint-disable-next-line security/detect-object-injection
    const config = IMAGE_TYPE_CONFIG[imageType as keyof typeof IMAGE_TYPE_CONFIG];
    // eslint-disable-next-line security/detect-object-injection
    const typeImages = images[imageType] || [];
    const canUpload = typeImages.length < config.maxCount;

    return (
      <Card key={imageType} className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <config.icon className="h-5 w-5" />
              <span>{config.label}</span>
              <Badge variant="outline" className="text-xs">
                {typeImages.length}/{config.maxCount}
              </Badge>
            </div>
            {canUpload && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleUploadClick(imageType)}
                disabled={disabled}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Upload
              </Button>
            )}
          </CardTitle>
          <p className="text-sm text-gray-400">{config.description}</p>
        </CardHeader>

        <CardContent>
          {typeImages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              <config.icon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No {config.label.toLowerCase()} uploaded</p>
              {canUpload && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleUploadClick(imageType)}
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {config.label}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {typeImages.map(image => renderImageCard(image, imageType))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Image Type Sections */}
      <div className="space-y-6">
        {(Object.keys(IMAGE_TYPE_CONFIG) as ImageType[]).map(renderImageTypeSection)}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-200">Uploading...</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="mb-4 last:mb-0">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span className="truncate">{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit Image Dialog */}
      {editingImage && (
        <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Image</DialogTitle>
              <DialogDescription>
                Update the image metadata and settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  defaultValue={editingImage.alt_text || ''}
                  onChange={(e) => {
                    setEditingImage(prev => prev ? { ...prev, alt_text: e.target.value } : null);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={editingImage.description || ''}
                  onChange={(e) => {
                    setEditingImage(prev => prev ? { ...prev, description: e.target.value } : null);
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingImage(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => editingImage && handleEdit(editingImage.id, {
                  alt_text: editingImage.alt_text,
                  description: editingImage.description,
                })}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Image Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewImage.file_name || 'Image Preview'}</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-hidden rounded-lg bg-gray-900">
              <Image
                src={previewImage.file_url}
                alt={previewImage.alt_text || 'Preview'}
                className="w-full h-full object-contain"
                width={800}
                height={600}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingImage} onOpenChange={() => setDeletingImage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ImageManager;