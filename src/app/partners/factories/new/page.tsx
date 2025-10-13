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
  ArrowLeft,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Clock,
  Plus,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewFactoryPartnerPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capabilityInput, setCapabilityInput] = useState("");
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");

  const utils = api.useUtils();

  // Create factory partner mutation
  const createFactoryMutation = api.partners.createFactory.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.partners.getFactories.invalidate();

      toast({
        title: "Factory Partner Added",
        description: data.message || "Factory partner added successfully",
      });
      router.push(`/partners/factories/${data.factory.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add factory partner",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/partners/factories");
  };

  const handleAddCapability = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && capabilityInput.trim()) {
      e.preventDefault();
      if (!capabilities.includes(capabilityInput.trim())) {
        setCapabilities([...capabilities, capabilityInput.trim()]);
      }
      setCapabilityInput("");
    }
  };

  const handleRemoveCapability = (capabilityToRemove: string) => {
    setCapabilities(capabilities.filter((capability) => capability !== capabilityToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a company name.",
        variant: "destructive",
      });
      return;
    }

    if (!contactName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a contact name.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    // Create factory partner
    createFactoryMutation.mutate({
      company_name: companyName.trim(),
      primary_contact: contactName.trim(),
      primary_email: email.trim(),
      primary_phone: phone.trim(),
      city: city.trim(),
      country: country.trim(),
      address_line1: street.trim(),
      postal_code: zipCode.trim(),
      notes: notes.trim() || undefined,
    });
  };

  const isFormValid = companyName.trim() && contactName.trim() && email.trim();

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
              disabled={createFactoryMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Add Factory Partner</h1>
              <p className="text-muted-foreground">Register a new factory partner</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The partner ID will be automatically generated when you add the factory.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Factory Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company-name" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" aria-hidden="true" />
                  Company Name
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="company-name"
                  placeholder="Enter company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={createFactoryMutation.isPending}
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="flex items-center gap-2">
                  <User className="w-4 h-4" aria-hidden="true" />
                  Contact Name
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="contact-name"
                  placeholder="Enter primary contact name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  disabled={createFactoryMutation.isPending}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  Email
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="factory@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createFactoryMutation.isPending}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={createFactoryMutation.isPending}
                />
              </div>

              {/* Capabilities */}
              <div className="space-y-2">
                <Label htmlFor="capabilities">Capabilities (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    id="capabilities"
                    placeholder="Type a capability and press Enter"
                    value={capabilityInput}
                    onChange={(e) => setCapabilityInput(e.target.value)}
                    onKeyDown={handleAddCapability}
                    disabled={createFactoryMutation.isPending}
                  />
                  {capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {capabilities.map((capability) => (
                        <div
                          key={capability}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          {capability}
                          <button
                            type="button"
                            onClick={() => handleRemoveCapability(capability)}
                            disabled={createFactoryMutation.isPending}
                            className="hover:text-primary/70"
                            aria-label={`Remove capability ${capability}`}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  e.g., Woodworking, Metal Fabrication, Upholstery
                </p>
              </div>

              {/* Minimum Order Quantity */}
              <div className="space-y-2">
                <Label htmlFor="minimum-order-quantity" className="flex items-center gap-2">
                  <Package className="w-4 h-4" aria-hidden="true" />
                  Minimum Order Quantity (Optional)
                </Label>
                <Input
                  id="minimum-order-quantity"
                  type="number"
                  placeholder="e.g., 100"
                  value={minimumOrderQuantity}
                  onChange={(e) => setMinimumOrderQuantity(e.target.value)}
                  disabled={createFactoryMutation.isPending}
                />
              </div>

              {/* Lead Time Days */}
              <div className="space-y-2">
                <Label htmlFor="lead-time-days" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  Lead Time (Days) (Optional)
                </Label>
                <Input
                  id="lead-time-days"
                  type="number"
                  placeholder="e.g., 30"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  disabled={createFactoryMutation.isPending}
                />
              </div>

              {/* Address Section */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Address (Optional)
                </Label>

                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    placeholder="123 Main St"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    disabled={createFactoryMutation.isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={createFactoryMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={createFactoryMutation.isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip-code">ZIP/Postal Code</Label>
                    <Input
                      id="zip-code"
                      placeholder="10001"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      disabled={createFactoryMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={createFactoryMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about the factory partner..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={createFactoryMutation.isPending}
                  rows={3}
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
              disabled={createFactoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createFactoryMutation.isPending}
            >
              {createFactoryMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Factory Partner
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
