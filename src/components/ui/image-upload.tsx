"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
 value?: string;
 onChange: (_url: string) => void;
 onRemove?: () => void;
 disabled?: boolean;
 maxSize?: number; // in MB
 accept?: string;
 className?: string;
}

export function ImageUpload({
 value,
 onChange,
 onRemove,
 disabled = false,
 maxSize = 5,
 accept = "image/jpeg,image/png,image/webp,image/gif",
 className,
}: ImageUploadProps) {
 const [isUploading, setIsUploading] = useState(false);
 const [isDragging, setIsDragging] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileSelect = async (file: File) => {
 setError(null);

 // Validate file size
 const maxSizeBytes = maxSize * 1024 * 1024;
 if (file.size > maxSizeBytes) {
 setError(`File size must be less than ${maxSize}MB`);
 return;
 }

 // Validate file type
 const acceptedTypes = accept.split(',').map(t => t.trim());
 if (!acceptedTypes.includes(file.type)) {
 setError('Invalid file type. Please upload an image.');
 return;
 }

 setIsUploading(true);

 try {
 // Create FormData for upload
 const formData = new FormData();
 formData.append('file', file);

 // Upload to Next.js API route which handles Supabase storage
 const response = await fetch('/api/upload/product-image', {
 method: 'POST',
 body: formData,
 });

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.error || 'Upload failed');
 }

 const data = await response.json();

 if (data.success && data.url) {
 onChange(data.url);
 } else {
 throw new Error(data.error || 'Upload failed');
 }
 } catch (err) {
 console.error('Upload error:', err);
 setError(err instanceof Error ? err.message : 'Failed to upload image');
 } finally {
 setIsUploading(false);
 }
 };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 handleFileSelect(file);
 }
 // Reset input value to allow uploading same file again
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 if (!disabled) {
 setIsDragging(true);
 }
 };

 const handleDragLeave = () => {
 setIsDragging(false);
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);

 if (disabled) return;

 const file = e.dataTransfer.files[0];
 if (file) {
 handleFileSelect(file);
 }
 };

 const handleRemove = () => {
 if (onRemove) {
 onRemove();
 } else {
 onChange('');
 }
 setError(null);
 };

 return (
 <div className={cn("space-y-2", className)}>
 <input
 ref={fileInputRef}
 type="file"
 accept={accept}
 onChange={handleInputChange}
 disabled={disabled || isUploading}
 className="hidden"
 />

 {value ? (
 <div className="relative group">
 <div className="relative aspect-video w-full overflow-hidden rounded-lg border border card">
 <Image
 src={value}
 alt="Uploaded image"
 className="object-contain"
 fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 />
 </div>
 <Button
 type="button"
 variant="destructive"
 size="icon"
 className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
 onClick={handleRemove}
 disabled={disabled || isUploading}
 >
 <X className="h-4 w-4" />
 </Button>
 </div>
 ) : (
 <div
 className={cn(
 "relative flex flex-col items-center justify-center",
 "w-full aspect-video rounded-lg border-2 border-dashed",
 "transition-colors cursor-pointer",
 isDragging
 ? "border-blue-500 bg-blue-500/10"
 : "border card/50 hover:card",
 (disabled || isUploading) && "opacity-50 cursor-not-allowed"
 )}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
 >
 {isUploading ? (
 <div className="flex flex-col items-center gap-2">
 <Loader2 className="h-8 w-8 text-tertiary animate-spin" />
 <p className="text-sm text-tertiary">Uploading...</p>
 </div>
 ) : (
 <div className="flex flex-col items-center gap-2 p-6 text-center">
 {isDragging ? (
 <Upload className="h-8 w-8 text-blue-500" />
 ) : (
 <ImageIcon className="h-8 w-8 text-tertiary" />
 )}
 <div className="space-y-1">
 <p className="text-sm font-medium ">
 {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
 </p>
 <p className="text-xs text-tertiary">
 Max size: {maxSize}MB
 </p>
 </div>
 </div>
 )}
 </div>
 )}

 {error && (
 <p className="text-sm text-red-500">{error}</p>
 )}
 </div>
 );
}
