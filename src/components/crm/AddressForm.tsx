"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AddressFormData {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country: string;
  address_type: "Business" | "Residential";
  is_primary: boolean;
}

interface AddressFormProps {
  data: AddressFormData;
  onChange: (_updatedData: AddressFormData) => void;
  disabled?: boolean;
}

const COUNTRIES = [
  { value: "USA", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "France", label: "France" },
  { value: "Germany", label: "Germany" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
];

export function AddressForm({ data, onChange, disabled = false }: AddressFormProps) {
  const handleChange = (field: keyof AddressFormData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Address Line 1 */}
      <div className="space-y-2">
        <Label htmlFor="address_line_1">
          Address Line 1 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address_line_1"
          value={data.address_line_1}
          onChange={(e) => handleChange("address_line_1", e.target.value)}
          placeholder="Street address"
          disabled={disabled}
          required
        />
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor="address_line_2">Address Line 2</Label>
        <Input
          id="address_line_2"
          value={data.address_line_2 || ""}
          onChange={(e) => handleChange("address_line_2", e.target.value)}
          placeholder="Apartment, suite, etc. (optional)"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="City"
            disabled={disabled}
            required
          />
        </div>

        {/* State/Province */}
        <div className="space-y-2">
          <Label htmlFor="state_province">State/Province</Label>
          <Input
            id="state_province"
            value={data.state_province || ""}
            onChange={(e) => handleChange("state_province", e.target.value)}
            placeholder="State or Province"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Postal Code */}
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            value={data.postal_code || ""}
            onChange={(e) => handleChange("postal_code", e.target.value)}
            placeholder="Postal/ZIP code"
            disabled={disabled}
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">
            Country <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.country}
            onValueChange={(value) => handleChange("country", value)}
            disabled={disabled}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address Type */}
      <div className="space-y-2">
        <Label htmlFor="address_type">Address Type</Label>
        <Select
          value={data.address_type}
          onValueChange={(value) => handleChange("address_type", value as "Business" | "Residential")}
          disabled={disabled}
        >
          <SelectTrigger id="address_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Primary Address Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_primary"
          checked={data.is_primary}
          onCheckedChange={(checked) => handleChange("is_primary", checked === true)}
          disabled={disabled}
        />
        <Label
          htmlFor="is_primary"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Set as primary address
        </Label>
      </div>
    </div>
  );
}
