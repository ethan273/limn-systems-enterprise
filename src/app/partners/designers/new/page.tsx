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
  Globe,
  Plus,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewDesignerPartnerPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");

  const utils = api.useUtils();

  // Create designer partner mutation
  const createDesignerMutation = api.partners.createDesigner.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.partners.getDesigners.invalidate();

      toast({
        title: "Designer Partner Added",
        description: data.message || "Designer partner added successfully",
      });
      router.push(`/partners/designers/${data.designer.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add designer partner",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/partners/designers");
  };

  const handleAddSpecialty = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && specialtyInput.trim()) {
      e.preventDefault();
      if (!specialties.includes(specialtyInput.trim())) {
        setSpecialties([...specialties, specialtyInput.trim()]);
      }
      setSpecialtyInput("");
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    setSpecialties(specialties.filter((specialty) => specialty !== specialtyToRemove));
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

    // Create designer partner
    createDesignerMutation.mutate({
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
              disabled={createDesignerMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Add Designer Partner</h1>
              <p className="text-muted-foreground">Register a new designer partner</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The partner ID will be automatically generated when you add the designer.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Designer Information</CardTitle>
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
                  disabled={createDesignerMutation.isPending}
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
                  disabled={createDesignerMutation.isPending}
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
                  placeholder="designer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createDesignerMutation.isPending}
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
                  disabled={createDesignerMutation.isPending}
                />
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    id="specialties"
                    placeholder="Type a specialty and press Enter"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyDown={handleAddSpecialty}
                    disabled={createDesignerMutation.isPending}
                  />
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty) => (
                        <div
                          key={specialty}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialty(specialty)}
                            disabled={createDesignerMutation.isPending}
                            className="hover:text-primary/70"
                            aria-label={`Remove specialty ${specialty}`}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  e.g., Furniture, Lighting, Textiles
                </p>
              </div>

              {/* Portfolio URL */}
              <div className="space-y-2">
                <Label htmlFor="portfolio-url" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  Portfolio URL (Optional)
                </Label>
                <Input
                  id="portfolio-url"
                  type="url"
                  placeholder="https://designer-portfolio.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  disabled={createDesignerMutation.isPending}
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
                    disabled={createDesignerMutation.isPending}
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
                      disabled={createDesignerMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={createDesignerMutation.isPending}
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
                      disabled={createDesignerMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={createDesignerMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about the designer partner..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={createDesignerMutation.isPending}
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
              disabled={createDesignerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createDesignerMutation.isPending}
            >
              {createDesignerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Designer Partner
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
