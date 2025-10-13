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
  Package,
  Plus,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewPackingJobPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [productionOrderId, setProductionOrderId] = useState("none");
  const [quantity, setQuantity] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [priority, setPriority] = useState("normal");

  // Fetch production orders
  const { data: ordersData, isLoading: ordersLoading } = api.productionOrders.getAll.useQuery({
    limit: 100,
  });

  // Create packing job mutation
  const createJobMutation = api.packing.createJob.useMutation({
    onSuccess: async (data) => {
      toast({
        title: "Packing Job Created",
        description: data.message,
      });
      // Invalidate cache
      await utils.packing.getAllJobs.invalidate();
      router.push(`/production/packing/${data.job.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create packing job",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/production/packing");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (productionOrderId === "none") {
      toast({
        title: "Validation Error",
        description: "Please select a production order.",
        variant: "destructive",
      });
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    // Create packing job
    createJobMutation.mutate({
      orderId: productionOrderId,
      quantity: parseInt(quantity, 10),
      specialInstructions: specialInstructions.trim() || undefined,
      priority: priority as "low" | "high" | "normal",
    });
  };

  const isFormValid = productionOrderId !== "none" && quantity && parseFloat(quantity) > 0;

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
              disabled={createJobMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Packing Job</h1>
              <p className="text-muted-foreground">Prepare items for shipment</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The packing job number will be automatically generated when you create the job.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Packing Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Production Order */}
              <div className="space-y-2">
                <Label htmlFor="production-order" className="flex items-center gap-2">
                  <Package className="w-4 h-4" aria-hidden="true" />
                  Production Order
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={productionOrderId}
                  onValueChange={setProductionOrderId}
                  disabled={ordersLoading || createJobMutation.isPending}
                >
                  <SelectTrigger id="production-order">
                    <SelectValue placeholder="Select production order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select an order</SelectItem>
                    {ordersData?.items?.map((order: { id: string; order_number: string; items?: { description?: string } }) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} {order.items?.description ? `- ${order.items.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter quantity to pack"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={createJobMutation.isPending}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  disabled={createJobMutation.isPending}
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

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label htmlFor="special-instructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="special-instructions"
                  placeholder="Add any special packing instructions..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  disabled={createJobMutation.isPending}
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
              disabled={createJobMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createJobMutation.isPending}
            >
              {createJobMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create Packing Job
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
