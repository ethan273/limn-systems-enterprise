"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddressForm, type AddressFormData } from "./AddressForm";
import { MapPin, Plus, Pencil, Trash2, Building, Home } from "lucide-react";
import { toast } from "sonner";

export interface Address {
  id: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state_province?: string | null;
  postal_code?: string | null;
  country: string;
  address_type: "Business" | "Residential";
  is_primary: boolean;
}

interface AddressListProps {
  addresses: Address[];
  onAdd: (address: Omit<Address, "id">) => Promise<void>;
  onUpdate: (id: string, address: Partial<Address>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function AddressList({
  addresses,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
}: AddressListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    address_line_1: "",
    address_line_2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "USA",
    address_type: "Business",
    is_primary: addresses.length === 0, // First address is primary by default
  });

  const handleAdd = async () => {
    if (!formData.address_line_1 || !formData.city || !formData.country) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await onAdd({
        ...formData,
        address_line_2: formData.address_line_2 || null,
        state_province: formData.state_province || null,
        postal_code: formData.postal_code || null,
      });
      toast.success("Address added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        address_line_1: "",
        address_line_2: "",
        city: "",
        state_province: "",
        postal_code: "",
        country: "USA",
        address_type: "Business",
        is_primary: false,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add address");
    }
  };

  const handleEdit = async () => {
    if (!editingAddress) return;
    if (!formData.address_line_1 || !formData.city || !formData.country) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await onUpdate(editingAddress.id, {
        ...formData,
        address_line_2: formData.address_line_2 || null,
        state_province: formData.state_province || null,
        postal_code: formData.postal_code || null,
      });
      toast.success("Address updated successfully");
      setEditingAddress(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update address");
    }
  };

  const handleDelete = async () => {
    if (!deletingAddress) return;

    try {
      await onDelete(deletingAddress.id);
      toast.success("Address deleted successfully");
      setDeletingAddress(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete address");
    }
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      city: address.city,
      state_province: address.state_province || "",
      postal_code: address.postal_code || "",
      country: address.country,
      address_type: address.address_type,
      is_primary: address.is_primary,
    });
  };

  const formatAddress = (address: Address) => {
    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.city,
      address.state_province,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Addresses</h3>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No addresses yet</h3>
            <p className="text-muted-foreground mb-4">
              Add an address to get started
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_primary ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {address.address_type === "Business" ? (
                      <Building className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Home className="h-4 w-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base">
                      {address.address_type}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {address.is_primary && (
                      <Badge variant="default" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{formatAddress(address)}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(address)}
                    disabled={isLoading}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingAddress(address)}
                    disabled={isLoading || address.is_primary}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Address Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Enter the address details below.
            </DialogDescription>
          </DialogHeader>
          <AddressForm data={formData} onChange={setFormData} disabled={isLoading} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={!!editingAddress} onOpenChange={() => setEditingAddress(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update the address details below.
            </DialogDescription>
          </DialogHeader>
          <AddressForm data={formData} onChange={setFormData} disabled={isLoading} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingAddress(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAddress} onOpenChange={() => setDeletingAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
