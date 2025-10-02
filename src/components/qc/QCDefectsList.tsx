"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Plus, Camera, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface QCDefectsListProps {
 inspectionId: string;
 defects: any[];
 onUpdate: () => void;
}

const severityConfig: Record<string, { label: string; className: string }> = {
 critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-300" },
 major: { label: "Major", className: "bg-orange-100 text-orange-800 border-orange-300" },
 minor: { label: "Minor", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
 cosmetic: { label: "Cosmetic", className: "card border" },
};

export function QCDefectsList({ inspectionId, defects, onUpdate }: QCDefectsListProps) {
 const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 const [selectedDefect, setSelectedDefect] = useState<any | null>(null);
 const [formData, setFormData] = useState({
 defectType: "",
 severity: "minor" as "critical" | "major" | "minor" | "cosmetic",
 description: "",
 location: "",
 actionRequired: "",
 });

 // Add defect mutation
 const addDefectMutation = api.qc.addDefect.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Defect added successfully",
 });
 setIsAddDialogOpen(false);
 setFormData({
 defectType: "",
 severity: "minor",
 description: "",
 location: "",
 actionRequired: "",
 });
 onUpdate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to add defect",
 variant: "destructive",
 });
 },
 });

 const handleAddDefect = () => {
 addDefectMutation.mutate({
 inspectionId,
 defectType: formData.defectType,
 severity: formData.severity,
 description: formData.description,
 location: formData.location || undefined,
 actionRequired: formData.actionRequired || undefined,
 });
 };

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold">Defects & Issues</h3>
 <Button onClick={() => setIsAddDialogOpen(true)}>
 <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
 Add Defect
 </Button>
 </div>

 {/* Defects List */}
 {defects.length === 0 ? (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm mb-4">No defects recorded</p>
 <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
 <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
 Add First Defect
 </Button>
 </div>
 </CardContent>
 </Card>
 ) : (
 <div className="grid grid-cols-1 gap-4">
 {defects.map((defect) => {
 const config = severityConfig[defect.severity] || severityConfig.minor;
 return (
 <Card
 key={defect.id}
 className="cursor-pointer hover:shadow-md transition-shadow"
 onClick={() => setSelectedDefect(defect)}
 >
 <CardHeader>
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <CardTitle className="text-base">{defect.defect_type}</CardTitle>
 <p className="text-sm text-muted-foreground mt-1">
 {defect.description}
 </p>
 </div>
 <Badge variant="outline" className={cn(config.className, "ml-4")}>
 {config.label}
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-3">
 {defect.location && (
 <div>
 <span className="text-sm font-medium text-muted-foreground">Location: </span>
 <span className="text-sm">{defect.location}</span>
 </div>
 )}
 {defect.action_required && (
 <div>
 <span className="text-sm font-medium text-muted-foreground">Action Required: </span>
 <span className="text-sm">{defect.action_required}</span>
 </div>
 )}
 <div className="flex items-center gap-4 text-sm text-muted-foreground">
 <div className="flex items-center gap-1">
 <Camera className="w-4 h-4" aria-hidden="true" />
 {defect._count?.qc_photos || 0} photos
 </div>
 <div className="flex items-center gap-1">
 <MessageSquare className="w-4 h-4" aria-hidden="true" />
 {defect._count?.qc_issue_comments || 0} comments
 </div>
 {defect.resolved_at && (
 <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
 Resolved
 </Badge>
 )}
 </div>
 <div className="text-xs text-muted-foreground">
 Created {format(new Date(defect.created_at), "MMM d, yyyy h:mm a")}
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}

 {/* Add Defect Dialog */}
 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>Add Defect</DialogTitle>
 <DialogDescription>
 Document a quality issue or defect found during inspection
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <div>
 <Label htmlFor="defectType">Defect Type *</Label>
 <Input
 id="defectType"
 placeholder="e.g., Scratch, Dent, Misalignment, etc."
 value={formData.defectType}
 onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
 />
 </div>
 <div>
 <Label htmlFor="severity">Severity *</Label>
 <Select
 value={formData.severity}
 onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
 >
 <SelectTrigger id="severity">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="critical">Critical - Requires immediate action</SelectItem>
 <SelectItem value="major">Major - Significant issue</SelectItem>
 <SelectItem value="minor">Minor - Small issue</SelectItem>
 <SelectItem value="cosmetic">Cosmetic - Aesthetic only</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label htmlFor="description">Description *</Label>
 <Textarea
 id="description"
 placeholder="Detailed description of the defect..."
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 rows={4}
 />
 </div>
 <div>
 <Label htmlFor="location">Location</Label>
 <Input
 id="location"
 placeholder="e.g., Left armrest, Front panel, etc."
 value={formData.location}
 onChange={(e) => setFormData({ ...formData, location: e.target.value })}
 />
 </div>
 <div>
 <Label htmlFor="actionRequired">Action Required</Label>
 <Textarea
 id="actionRequired"
 placeholder="What needs to be done to resolve this defect..."
 value={formData.actionRequired}
 onChange={(e) => setFormData({ ...formData, actionRequired: e.target.value })}
 rows={3}
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
 Cancel
 </Button>
 <Button
 onClick={handleAddDefect}
 disabled={!formData.defectType || !formData.description || addDefectMutation.isPending}
 >
 Add Defect
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Defect Detail Dialog */}
 {selectedDefect && (
 <Dialog open={!!selectedDefect} onOpenChange={() => setSelectedDefect(null)}>
 <DialogContent className="max-w-3xl">
 <DialogHeader>
 <DialogTitle>{selectedDefect.defect_type}</DialogTitle>
 <DialogDescription>
 {format(new Date(selectedDefect.created_at), "MMM d, yyyy h:mm a")}
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <div>
 <Badge variant="outline" className={cn(severityConfig[selectedDefect.severity].className)}>
 {severityConfig[selectedDefect.severity].label}
 </Badge>
 </div>
 <div>
 <Label>Description</Label>
 <p className="text-sm mt-1">{selectedDefect.description}</p>
 </div>
 {selectedDefect.location && (
 <div>
 <Label>Location</Label>
 <p className="text-sm mt-1">{selectedDefect.location}</p>
 </div>
 )}
 {selectedDefect.action_required && (
 <div>
 <Label>Action Required</Label>
 <p className="text-sm mt-1">{selectedDefect.action_required}</p>
 </div>
 )}
 {selectedDefect.resolved_at && (
 <div>
 <Label>Resolved At</Label>
 <p className="text-sm mt-1">
 {format(new Date(selectedDefect.resolved_at), "MMM d, yyyy h:mm a")}
 </p>
 </div>
 )}
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-muted-foreground">Photos: </span>
 <span className="font-medium">{selectedDefect._count?.qc_photos || 0}</span>
 </div>
 <div>
 <span className="text-muted-foreground">Comments: </span>
 <span className="font-medium">{selectedDefect._count?.qc_issue_comments || 0}</span>
 </div>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 )}
 </div>
 );
}
