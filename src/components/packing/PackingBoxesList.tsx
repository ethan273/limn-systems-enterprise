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
import { Box, Plus, Trash2, Weight, Ruler } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PackingBoxesListProps {
  packingJobId: string;
  boxes: any[];
  onUpdate: () => void;
}

export function PackingBoxesList({ packingJobId, boxes, onUpdate }: PackingBoxesListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    boxNumber: boxes.length + 1,
    boxType: "",
    dimensions: "",
    weight: "",
    contentsDescription: "",
    barcode: "",
    trackingNumber: "",
  });

  // Add box mutation
  const addBoxMutation = api.packing.addBox.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Box added successfully",
      });
      setIsAddDialogOpen(false);
      setFormData({
        boxNumber: boxes.length + 2,
        boxType: "",
        dimensions: "",
        weight: "",
        contentsDescription: "",
        barcode: "",
        trackingNumber: "",
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add box",
        variant: "destructive",
      });
    },
  });

  // Delete box mutation
  const deleteBoxMutation = api.packing.deleteBox.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Box deleted successfully",
      });
      setSelectedBox(null);
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete box",
        variant: "destructive",
      });
    },
  });

  const handleAddBox = () => {
    addBoxMutation.mutate({
      packingJobId,
      boxNumber: formData.boxNumber,
      boxType: formData.boxType || undefined,
      dimensions: formData.dimensions || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      contentsDescription: formData.contentsDescription || undefined,
      barcode: formData.barcode || undefined,
      trackingNumber: formData.trackingNumber || undefined,
    });
  };

  const handleDelete = (boxId: string) => {
    if (confirm("Are you sure you want to delete this box?")) {
      deleteBoxMutation.mutate({ id: boxId });
    }
  };

  const totalWeight = boxes.reduce((sum, box) => sum + (Number(box.weight) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Packing Boxes</h3>
          <p className="text-sm text-muted-foreground">
            {boxes.length} {boxes.length === 1 ? "box" : "boxes"} • Total weight: {totalWeight.toFixed(2)} lbs
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Add Box
        </Button>
      </div>

      {/* Boxes List */}
      {boxes.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Box className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p className="text-sm mb-4">No boxes added yet</p>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Add First Box
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boxes.map((box) => (
            <Card
              key={box.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedBox(box)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Box className="w-4 h-4" aria-hidden="true" />
                      Box #{box.box_number}
                    </CardTitle>
                    {box.box_type && (
                      <Badge variant="outline" className="mt-2">{box.box_type}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(box.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {box.dimensions && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="font-medium">{box.dimensions}</span>
                  </div>
                )}
                {box.weight && (
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{Number(box.weight).toFixed(2)} lbs</span>
                  </div>
                )}
                {box.contents_description && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Contents:</span>
                    <p className="mt-1">{box.contents_description}</p>
                  </div>
                )}
                {box.barcode && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Barcode:</span>
                    <p className="mt-1 font-mono">{box.barcode}</p>
                  </div>
                )}
                {box.tracking_number && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tracking:</span>
                    <p className="mt-1 font-mono">{box.tracking_number}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Added {format(new Date(box.created_at), "MMM d, yyyy")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Box Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Packing Box</DialogTitle>
            <DialogDescription>
              Add a new box to this packing job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="boxNumber">Box Number *</Label>
                <Input
                  id="boxNumber"
                  type="number"
                  value={formData.boxNumber}
                  onChange={(e) => setFormData({ ...formData, boxNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="boxType">Box Type</Label>
                <Input
                  id="boxType"
                  placeholder="e.g., Cardboard, Wooden Crate, etc."
                  value={formData.boxType}
                  onChange={(e) => setFormData({ ...formData, boxType: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dimensions">Dimensions (L x W x H)</Label>
                <Input
                  id="dimensions"
                  placeholder="e.g., 24 x 18 x 12 inches"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="contentsDescription">Contents Description</Label>
              <Textarea
                id="contentsDescription"
                placeholder="Describe what's in this box..."
                value={formData.contentsDescription}
                onChange={(e) => setFormData({ ...formData, contentsDescription: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Box barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  placeholder="Shipping tracking #"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBox}
              disabled={addBoxMutation.isPending}
            >
              Add Box
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Box Detail Dialog */}
      {selectedBox && (
        <Dialog open={!!selectedBox} onOpenChange={() => setSelectedBox(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Box #{selectedBox.box_number}</DialogTitle>
              <DialogDescription>
                {selectedBox.box_type || "Packing box details"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBox.dimensions && (
                <div>
                  <Label>Dimensions</Label>
                  <p className="text-sm mt-1">{selectedBox.dimensions}</p>
                </div>
              )}
              {selectedBox.weight && (
                <div>
                  <Label>Weight</Label>
                  <p className="text-sm mt-1">{Number(selectedBox.weight).toFixed(2)} lbs</p>
                </div>
              )}
              {selectedBox.contents_description && (
                <div>
                  <Label>Contents</Label>
                  <p className="text-sm mt-1">{selectedBox.contents_description}</p>
                </div>
              )}
              {selectedBox.barcode && (
                <div>
                  <Label>Barcode</Label>
                  <p className="text-sm mt-1 font-mono">{selectedBox.barcode}</p>
                </div>
              )}
              {selectedBox.tracking_number && (
                <div>
                  <Label>Tracking Number</Label>
                  <p className="text-sm mt-1 font-mono">{selectedBox.tracking_number}</p>
                </div>
              )}
              <div>
                <Label>Added Date</Label>
                <p className="text-sm mt-1">
                  {format(new Date(selectedBox.created_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedBox.id)}
                disabled={deleteBoxMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Delete Box
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
