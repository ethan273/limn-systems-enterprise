"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from "@/components/ui/select";
import {
 ArrowLeft,
 Upload,
 Loader2,
 FileText,
 Package,
 Building2,
 X,
 CheckCircle2,
 AlertTriangle,
 RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/common/EmptyState";

export default function NewShopDrawingPage() {
 const router = useRouter();
 const [productionOrderId, setProductionOrderId] = useState("");
 const [factoryId, setFactoryId] = useState("none");
 const [drawingName, setDrawingName] = useState("");
 const [drawingType, setDrawingType] = useState("");
 const [notes, setNotes] = useState("");
 const [internalNotes, setInternalNotes] = useState("");
 const [tags, setTags] = useState<string[]>([]);
 const [tagInput, setTagInput] = useState("");
 const [file, setFile] = useState<File | null>(null);
 const [uploading, setUploading] = useState(false);

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Fetch production orders
 const { data: ordersData, isLoading: ordersLoading, error: ordersError } = api.productionOrders.getAll.useQuery({
 limit: 100,
 });

 // Fetch factories
 const { data: factoriesData, isLoading: factoriesLoading, error: factoriesError } = api.partners.getAll.useQuery({
 type: "factory",
 limit: 100,
 });

 // Create drawing mutation
 const createDrawingMutation = api.shopDrawings.create.useMutation({
 onSuccess: (data) => {
 toast({
 title: "Shop Drawing Created",
 description: data.message,
 });
 router.push(`/shop-drawings/${data.drawing.id}`);
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to create shop drawing",
 variant: "destructive",
 });
 setUploading(false);
 },
 });

 const handleBack = () => {
 router.push("/shop-drawings");
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const selectedFile = e.target.files?.[0];
 if (selectedFile) {
 // Validate file type
 if (selectedFile.type !== "application/pdf") {
 toast({
 title: "Invalid File Type",
 description: "Please upload a PDF file only.",
 variant: "destructive",
 });
 return;
 }

 // Validate file size (max 50MB)
 const maxSize = 50 * 1024 * 1024;
 if (selectedFile.size > maxSize) {
 toast({
 title: "File Too Large",
 description: "Please upload a file smaller than 50MB.",
 variant: "destructive",
 });
 return;
 }

 setFile(selectedFile);
 }
 };

 const handleRemoveFile = () => {
 setFile(null);
 };

 const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter" && tagInput.trim()) {
 e.preventDefault();
 if (!tags.includes(tagInput.trim())) {
 setTags([...tags, tagInput.trim()]);
 }
 setTagInput("");
 }
 };

 const handleRemoveTag = (tagToRemove: string) => {
 setTags(tags.filter((tag) => tag !== tagToRemove));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 // Validation
 if (!productionOrderId) {
 toast({
 title: "Validation Error",
 description: "Please select a production order.",
 variant: "destructive",
 });
 return;
 }

 if (!drawingName.trim()) {
 toast({
 title: "Validation Error",
 description: "Please enter a drawing name.",
 variant: "destructive",
 });
 return;
 }

 if (!file) {
 toast({
 title: "Validation Error",
 description: "Please upload a PDF file.",
 variant: "destructive",
 });
 return;
 }

 setUploading(true);

 try {
 // Upload file to storage
 const formData = new FormData();
 formData.append("file", file);
 formData.append("folder", "shop-drawings");

 const uploadResponse = await fetch("/api/upload", {
 method: "POST",
 body: formData,
 });

 if (!uploadResponse.ok) {
 throw new Error("File upload failed");
 }

 const uploadData = await uploadResponse.json() as { url: string };

 // Create shop drawing
 createDrawingMutation.mutate({
 productionOrderId,
 factoryId: factoryId === "none" ? undefined : factoryId,
 drawingName: drawingName.trim(),
 drawingType: drawingType.trim() || undefined,
 fileName: file.name,
 fileUrl: uploadData.url,
 fileSize: file.size,
 notes: notes.trim() || undefined,
 tags: tags.length > 0 ? tags : undefined,
 });
 } catch (error) {
 toast({
 title: "Upload Error",
 description: error instanceof Error ? error.message : "Failed to upload file",
 variant: "destructive",
 });
 setUploading(false);
 }
 };

 // Handle query errors
 if (ordersError || factoriesError) {
 const error = ordersError || factoriesError;
 return (
 <div className="container mx-auto p-6 max-w-3xl">
 <Breadcrumb />
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="sm" onClick={handleBack}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back
 </Button>
 <div>
 <h1 className="text-3xl font-bold">Upload New Shop Drawing</h1>
 <p className="text-muted-foreground">Create a new shop drawing with PDF file</p>
 </div>
 </div>
 <EmptyState
 icon={AlertTriangle}
 title="Failed to load form data"
 description={error?.message || "An unexpected error occurred. Please try again."}
 action={{
 label: 'Try Again',
 onClick: () => {
 if (ordersError) utils.productionOrders.getAll.invalidate();
 if (factoriesError) utils.partners.getAll.invalidate();
 },
 icon: RefreshCw,
 }}
 />
 </div>
 </div>
 );
 }

 const isFormValid = productionOrderId && drawingName.trim() && file;

 return (
 <div className="container mx-auto p-6 max-w-3xl">
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="sm" onClick={handleBack} disabled={uploading}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back
 </Button>
 <div>
 <h1 className="text-3xl font-bold">Upload New Shop Drawing</h1>
 <p className="text-muted-foreground">Create a new shop drawing with PDF file</p>
 </div>
 </div>
 </div>

 {/* Form */}
 <form onSubmit={handleSubmit}>
 <Card>
 <CardHeader>
 <CardTitle>Drawing Information</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 {/* Production Order */}
 <div className="space-y-2">
 <Label htmlFor="production-order" className="flex items-center gap-2">
 <Package className="w-4 h-4" aria-hidden="true" />
 Production Order
 <span className="text-destructive">*</span>
 </Label>
 <Select
 value={productionOrderId}
 onValueChange={setProductionOrderId}
 disabled={ordersLoading || uploading}
 >
 <SelectTrigger id="production-order">
 <SelectValue placeholder="Select production order" />
 </SelectTrigger>
 <SelectContent>
 {ordersData?.items?.map((order: { id: string; order_number: string; item_name: string }) => (
 <SelectItem key={order.id} value={order.id}>
 {order.order_number} - {order.item_name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Factory */}
 <div className="space-y-2">
 <Label htmlFor="factory" className="flex items-center gap-2">
 <Building2 className="w-4 h-4" aria-hidden="true" />
 Factory (Optional)
 </Label>
 <Select
 value={factoryId}
 onValueChange={setFactoryId}
 disabled={factoriesLoading || uploading}
 >
 <SelectTrigger id="factory">
 <SelectValue placeholder="Select factory" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">No Factory</SelectItem>
 {factoriesData?.partners?.map((factory) => (
 <SelectItem key={factory.id} value={factory.id}>
 {factory.company_name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Drawing Name */}
 <div className="space-y-2">
 <Label htmlFor="drawing-name">
 Drawing Name
 <span className="text-destructive ml-1">*</span>
 </Label>
 <Input
 id="drawing-name"
 placeholder="Enter drawing name"
 value={drawingName}
 onChange={(e) => setDrawingName(e.target.value)}
 disabled={uploading}
 />
 </div>

 {/* Drawing Type */}
 <div className="space-y-2">
 <Label htmlFor="drawing-type">Drawing Type (Optional)</Label>
 <Input
 id="drawing-type"
 placeholder="e.g., Assembly, Detail, Elevation"
 value={drawingType}
 onChange={(e) => setDrawingType(e.target.value)}
 disabled={uploading}
 />
 </div>

 {/* File Upload */}
 <div className="space-y-2">
 <Label htmlFor="file-upload" className="flex items-center gap-2">
 <FileText className="w-4 h-4" aria-hidden="true" />
 PDF File
 <span className="text-destructive">*</span>
 </Label>
 {file ? (
 <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
 <div className="flex items-center gap-3">
 <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
 <div>
 <p className="font-medium">{file.name}</p>
 <p className="text-sm text-muted-foreground">
 {(file.size / (1024 * 1024)).toFixed(2)} MB
 </p>
 </div>
 </div>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={handleRemoveFile}
 disabled={uploading}
 aria-label="Remove file"
 >
 <X className="w-4 h-4" aria-hidden="true" />
 </Button>
 </div>
 ) : (
 <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
 <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
 <div className="space-y-2">
 <p className="text-sm text-muted-foreground">
 Click to upload or drag and drop
 </p>
 <p className="text-xs text-muted-foreground">
 PDF files only, max 50MB
 </p>
 </div>
 <Input
 id="file-upload"
 type="file"
 accept=".pdf,application/pdf"
 onChange={handleFileChange}
 disabled={uploading}
 className="mt-4"
 />
 </div>
 )}
 </div>

 {/* Upload Notes */}
 <div className="space-y-2">
 <Label htmlFor="notes">Upload Notes (Optional)</Label>
 <Textarea
 id="notes"
 placeholder="Add any notes about this drawing..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 disabled={uploading}
 rows={3}
 />
 </div>

 {/* Internal Notes */}
 <div className="space-y-2">
 <Label htmlFor="internal-notes">Internal Notes (Optional)</Label>
 <Textarea
 id="internal-notes"
 placeholder="Private internal notes (not visible to factory)..."
 value={internalNotes}
 onChange={(e) => setInternalNotes(e.target.value)}
 disabled={uploading}
 rows={3}
 />
 </div>

 {/* Tags */}
 <div className="space-y-2">
 <Label htmlFor="tags">Tags (Optional)</Label>
 <div className="space-y-2">
 <Input
 id="tags"
 placeholder="Type a tag and press Enter"
 value={tagInput}
 onChange={(e) => setTagInput(e.target.value)}
 onKeyDown={handleAddTag}
 disabled={uploading}
 />
 {tags.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {tags.map((tag) => (
 <div
 key={tag}
 className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
 >
 {tag}
 <button
 type="button"
 onClick={() => handleRemoveTag(tag)}
 disabled={uploading}
 className="hover:text-primary/70"
 aria-label={`Remove tag ${tag}`}
 >
 <X className="w-3 h-3" aria-hidden="true" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 <p className="text-xs text-muted-foreground">
 Add tags to help organize and find drawings
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Actions */}
 <div className="flex items-center justify-between mt-6">
 <Button
 type="button"
 variant="outline"
 onClick={handleBack}
 disabled={uploading}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 disabled={!isFormValid || uploading || createDrawingMutation.isPending}
 >
 {uploading || createDrawingMutation.isPending ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
 Uploading...
 </>
 ) : (
 <>
 <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
 Upload Drawing
 </>
 )}
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
}
