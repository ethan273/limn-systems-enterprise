"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building, Home, MapPin } from "lucide-react";

export interface AddressOption {
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

interface AddressSelectorProps {
  addresses: AddressOption[];
  selectedAddressId?: string | null;
  onSelect: (addressId: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  allowNone?: boolean;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  label = "Shipping Address",
  placeholder = "Select shipping address",
  disabled = false,
  allowNone = true,
}: AddressSelectorProps) {
  const formatAddressShort = (address: AddressOption) => {
    return `${address.address_line_1}, ${address.city}, ${address.country}`;
  };

  const formatAddressFull = (address: AddressOption) => {
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
    <div className="space-y-2">
      <Label htmlFor="shipping_address">{label}</Label>
      <Select
        value={selectedAddressId || "none"}
        onValueChange={(value) => onSelect(value === "none" ? null : value)}
        disabled={disabled}
      >
        <SelectTrigger id="shipping_address">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowNone && (
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">No address selected</span>
              </div>
            </SelectItem>
          )}
          {addresses.length === 0 && !allowNone ? (
            <SelectItem value="none" disabled>
              <span className="text-muted-foreground">No addresses available</span>
            </SelectItem>
          ) : (
            addresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                <div className="flex items-center gap-2">
                  {address.address_type === "Business" ? (
                    <Building className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Home className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatAddressShort(address)}</span>
                      {address.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {address.address_type}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Show selected address details */}
      {selectedAddressId && addresses.find((a) => a.id === selectedAddressId) && (
        <div className="mt-2 p-3 bg-muted rounded-md">
          <p className="text-sm font-medium mb-1">Selected Shipping Address:</p>
          <p className="text-sm text-muted-foreground">
            {formatAddressFull(addresses.find((a) => a.id === selectedAddressId)!)}
          </p>
        </div>
      )}
    </div>
  );
}
