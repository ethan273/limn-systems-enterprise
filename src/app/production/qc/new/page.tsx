"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  ClipboardCheck,
  Plus,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewQCInspectionPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [itemType, setItemType] = useState<"production" | "prototype">("production");
  const [productionItemId, setProductionItemId] = useState("none");
  const [prototypeId, setPrototypeId] = useState("none");
  const [qcStage, setQcStage] = useState("incoming");
  const [priority, setPriority] = useState("normal");
  const [batchId, setBatchId] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch production items
  const { data: productionItemsData, isLoading: productionItemsLoading } = api.productionItems.getAll.useQuery({
    limit: 100,
  });

  // Fetch prototypes
  const { data: prototypesData, isLoading: prototypesLoading } = api.prototypeProduction.getAll.useQuery({
    limit: 100,
  });

  // Create QC inspection mutation
  const createInspectionMutation = api.qc.createInspection.useMutation({
    onSuccess: async (data) => {
      toast({
        title: "QC Inspection Created",
        description: data.message,
      });
      // Invalidate cache
      await utils.qc.getAllInspections.invalidate();
      router.push(`/production/qc/${data.inspection.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create QC inspection",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/production/qc");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (itemType === "production" && productionItemId === "none") {
      toast({
        title: "Validation Error",
        description: "Please select a production item.",
        variant: "destructive",
      });
      return;
    }

    if (itemType === "prototype" && prototypeId === "none") {
      toast({
        title: "Validation Error",
        description: "Please select a prototype.",
        variant: "destructive",
      });
      return;
    }

    if (!qcStage) {
      toast({
        title: "Validation Error",
        description: "Please select a QC stage.",
        variant: "destructive",
      });
      return;
    }

    // Create QC inspection
    createInspectionMutation.mutate({
      productionItemId: itemType === "production" && productionItemId !== "none" ? productionItemId : undefined,
      prototypeId: itemType === "prototype" && prototypeId !== "none" ? prototypeId : undefined,
      qcStage,
      priority,
      batchId: batchId.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const isFormValid =
    qcStage &&
    ((itemType === "production" && productionItemId !== "none") ||
     (itemType === "prototype" && prototypeId !== "none"));

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={createInspectionMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New QC Inspection</h1>
              <p className="text-muted-foreground">Schedule a quality control inspection</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The inspection number will be automatically generated when you create the inspection.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Inspection Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Type Selection */}
              <div className="space-y-2">
                <Label>Item Type</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={itemType === "production" ? "default" : "outline"}
                    onClick={() => setItemType("production")}
                    disabled={createInspectionMutation.isPending}
                  >
                    Production Item
                  </Button>
                  <Button
                    type="button"
                    variant={itemType === "prototype" ? "default" : "outline"}
                    onClick={() => setItemType("prototype")}
                    disabled={createInspectionMutation.isPending}
                  >
                    Prototype
                  </Button>
                </div>
              </div>

              {/* Production Item Selection */}
              {itemType === "production" && (
                <div className="space-y-2">
                  <Label htmlFor="production-item">
                    Production Item
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={productionItemId}
                    onValueChange={setProductionItemId}
                    disabled={productionItemsLoading || createInspectionMutation.isPending}
                  >
                    <SelectTrigger id="production-item">
                      <SelectValue placeholder="Select production item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select an item</SelectItem>
                      {productionItemsData?.items?.map((item: { id: string; item_name: string; item_number?: string }) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_name} {item.item_number ? `(${item.item_number})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Prototype Selection */}
              {itemType === "prototype" && (
                <div className="space-y-2">
                  <Label htmlFor="prototype">
                    Prototype
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={prototypeId}
                    onValueChange={setPrototypeId}
                    disabled={prototypesLoading || createInspectionMutation.isPending}
                  >
                    <SelectTrigger id="prototype">
                      <SelectValue placeholder="Select prototype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a prototype</SelectItem>
                      {prototypesData?.items?.map((proto: { id: string; prototypes?: { name: string; prototype_number?: string } }) => (
                        <SelectItem key={proto.id} value={proto.id}>
                          {proto.prototypes?.name || 'Unnamed'} {proto.prototypes?.prototype_number ? `(${proto.prototypes.prototype_number})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* QC Stage */}
              <div className="space-y-2">
                <Label htmlFor="qc-stage">
                  QC Stage
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={qcStage}
                  onValueChange={setQcStage}
                  disabled={createInspectionMutation.isPending}
                >
                  <SelectTrigger id="qc-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="in_process">In Process</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="pre_shipment">Pre-Shipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  disabled={createInspectionMutation.isPending}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Batch ID */}
              <div className="space-y-2">
                <Label htmlFor="batch-id">Batch ID (Optional)</Label>
                <Input
                  id="batch-id"
                  placeholder="Enter batch identifier"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  disabled={createInspectionMutation.isPending}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any inspection notes or requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={createInspectionMutation.isPending}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={createInspectionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createInspectionMutation.isPending}
            >
              {createInspectionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create Inspection
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
