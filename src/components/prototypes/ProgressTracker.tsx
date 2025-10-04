"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 Activity,
 Calendar,
 TrendingUp,
 AlertCircle,
 Edit,
 Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Production {
 id: string;
 status: string;
 overall_progress: number;
 current_phase: string | null;
 start_date: Date | null;
 target_date: Date | null;
 estimated_completion: Date | null;
 actual_completion: Date | null;
 quality_score: number | null;
 defects_found: number;
 rework_required: boolean;
 notes: string | null;
}

interface ProgressTrackerProps {
 prototypeId: string;
 production: Production | null;
 onUpdate?: () => void;
}

const statusOptions = [
 { value: "not_started", label: "Not Started", color: "card " },
 { value: "materials_sourcing", label: "Materials Sourcing", color: "bg-warning text-warning" },
 { value: "in_production", label: "In Production", color: "bg-info text-info" },
 { value: "assembly", label: "Assembly", color: "bg-primary text-primary" },
 { value: "finishing", label: "Finishing", color: "bg-primary text-primary" },
 { value: "quality_check", label: "Quality Check", color: "bg-warning text-warning" },
 { value: "completed", label: "Completed", color: "bg-success text-success" },
 { value: "approved", label: "Approved", color: "bg-success text-success" },
];

export function ProgressTracker({
 prototypeId,
 production,
 onUpdate,
}: ProgressTrackerProps) {
 const [editDialogOpen, setEditDialogOpen] = useState(false);
 const [progressValue, setProgressValue] = useState(production?.overall_progress.toString() || "0");
 const [statusValue, setStatusValue] = useState(production?.status || "not_started");
 const [currentPhase, setCurrentPhase] = useState(production?.current_phase || "");
 const [notes, setNotes] = useState(production?.notes || "");

 // Update progress mutation
 const updateProgressMutation = api.prototypes.updateProgress.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Progress updated successfully",
 });
 onUpdate?.();
 setEditDialogOpen(false);
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to update progress",
 variant: "destructive",
 });
 },
 });

 // Update status mutation
 const updateStatusMutation = api.prototypes.updateProduction.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Status updated successfully",
 });
 onUpdate?.();
 setEditDialogOpen(false);
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to update status",
 variant: "destructive",
 });
 },
 });

 const handleSaveProgress = () => {
 const progress = parseInt(progressValue);
 if (isNaN(progress) || progress < 0 || progress > 100) {
 toast({
 title: "Invalid Progress",
 description: "Progress must be between 0 and 100",
 variant: "destructive",
 });
 return;
 }

 // Update both progress and status if changed
 const promises: Promise<unknown>[] = [];

 if (progress !== production?.overall_progress) {
 promises.push(
 new Promise((resolve, reject) => {
 updateProgressMutation.mutate(
 { prototypeId, progress },
 { onSuccess: resolve, onError: reject }
 );
 })
 );
 }

 if (statusValue !== production?.status) {
 promises.push(
 new Promise((resolve, reject) => {
 updateStatusMutation.mutate(
 {
 prototypeId,
 status: statusValue,
 currentPhase: currentPhase || undefined,
 notes: notes || undefined,
 },
 { onSuccess: resolve, onError: reject }
 );
 })
 );
 }

 if (promises.length === 0) {
 toast({
 title: "No Changes",
 description: "No changes to save",
 });
 setEditDialogOpen(false);
 }
 };

 const getStatusConfig = (status: string) => {
 return statusOptions.find((opt) => opt.value === status) || statusOptions[0];
 };

 const statusConfig = getStatusConfig(production?.status || "not_started");

 return (
 <div className="space-y-4">
 {/* Progress Overview Card */}
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-2">
 <Activity className="w-5 h-5" aria-hidden="true" />
 Production Progress
 </CardTitle>
 <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
 <DialogTrigger asChild>
 <Button variant="outline" size="sm">
 <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
 Update Progress
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeader>
 <DialogTitle>Update Production Progress</DialogTitle>
 <DialogDescription>
 Update the current production status and progress percentage
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 {/* Progress Percentage */}
 <div className="space-y-2">
 <Label htmlFor="progress">
 Progress Percentage
 <span className="text-destructive ml-1">*</span>
 </Label>
 <div className="flex items-center gap-2">
 <Input
 id="progress"
 type="number"
 min="0"
 max="100"
 value={progressValue}
 onChange={(e) => setProgressValue(e.target.value)}
 className="flex-1"
 />
 <span className="text-muted-foreground">%</span>
 </div>
 <Progress value={parseInt(progressValue) || 0} />
 </div>

 {/* Status */}
 <div className="space-y-2">
 <Label htmlFor="status">Production Status</Label>
 <Select value={statusValue} onValueChange={setStatusValue}>
 <SelectTrigger id="status">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {statusOptions.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Current Phase */}
 <div className="space-y-2">
 <Label htmlFor="current-phase">Current Phase (Optional)</Label>
 <Input
 id="current-phase"
 placeholder="e.g., Frame assembly, Upholstery"
 value={currentPhase}
 onChange={(e) => setCurrentPhase(e.target.value)}
 />
 </div>

 {/* Notes */}
 <div className="space-y-2">
 <Label htmlFor="notes">Notes (Optional)</Label>
 <Textarea
 id="notes"
 placeholder="Add any notes about the current progress..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={3}
 />
 </div>
 </div>
 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 onClick={() => setEditDialogOpen(false)}
 >
 Cancel
 </Button>
 <Button
 onClick={handleSaveProgress}
 disabled={updateProgressMutation.isPending || updateStatusMutation.isPending}
 >
 {updateProgressMutation.isPending || updateStatusMutation.isPending ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
 Saving...
 </>
 ) : (
 "Save Changes"
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 </CardHeader>
 <CardContent className="space-y-6">
 {/* Progress Bar */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label className="text-muted-foreground">Overall Progress</Label>
 <span className="text-2xl font-bold">{production?.overall_progress || 0}%</span>
 </div>
 <Progress value={production?.overall_progress || 0} className="h-3" />
 </div>

 {/* Status & Phase */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label className="text-muted-foreground">Status</Label>
 <Badge
 variant="outline"
 className={cn("mt-2", statusConfig?.color)}
 >
 {statusConfig?.label}
 </Badge>
 </div>
 {production?.current_phase && (
 <div>
 <Label className="text-muted-foreground">Current Phase</Label>
 <p className="font-medium mt-2">{production?.current_phase}</p>
 </div>
 )}
 </div>

 {/* Timeline */}
 {(production?.start_date || production?.target_date) && (
 <div className="grid grid-cols-2 gap-4 pt-4 border-t">
 {production.start_date && (
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Calendar className="w-4 h-4" aria-hidden="true" />
 Start Date
 </Label>
 <p className="font-medium mt-1">
 {format(new Date(production.start_date), "MMM d, yyyy")}
 </p>
 </div>
 )}
 {production.target_date && (
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <TrendingUp className="w-4 h-4" aria-hidden="true" />
 Target Date
 </Label>
 <p className="font-medium mt-1">
 {format(new Date(production.target_date), "MMM d, yyyy")}
 </p>
 </div>
 )}
 </div>
 )}

 {/* Quality Metrics */}
 {(production?.quality_score !== null || production?.defects_found || production?.rework_required) && (
 <div className="grid grid-cols-3 gap-4 pt-4 border-t">
 {production?.quality_score !== null && (
 <div>
 <Label className="text-muted-foreground">Quality Score</Label>
 <p className="font-medium text-lg mt-1">
 {production?.quality_score}/100
 </p>
 </div>
 )}
 {production?.defects_found && production.defects_found > 0 && (
 <div>
 <Label className="text-muted-foreground">Defects Found</Label>
 <p className="font-medium text-lg mt-1 text-warning">
 {production?.defects_found}
 </p>
 </div>
 )}
 {production?.rework_required && (
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <AlertCircle className="w-4 h-4" aria-hidden="true" />
 Rework Required
 </Label>
 <Badge variant="destructive" className="mt-2">
 Yes
 </Badge>
 </div>
 )}
 </div>
 )}

 {/* Notes */}
 {production?.notes && (
 <div className="pt-4 border-t">
 <Label className="text-muted-foreground">Notes</Label>
 <p className="text-sm mt-2 whitespace-pre-wrap">{production.notes}</p>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
