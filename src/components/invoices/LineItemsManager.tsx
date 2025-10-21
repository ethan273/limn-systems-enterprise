"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Receipt } from "lucide-react";

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
}

interface LineItemsManagerProps {
  lineItems: LineItem[];
  onChange: (_lineItems: LineItem[]) => void;
  disabled?: boolean;
}

export function LineItemsManager({
  lineItems,
  onChange,
  disabled = false,
}: LineItemsManagerProps) {
  // Calculate line item subtotal (quantity * unitPrice - discount)
  const calculateLineSubtotal = (item: LineItem): number => {
    const baseAmount = item.quantity * item.unitPrice;
    const discountAmt = item.discountAmount || (baseAmount * (item.discountPercent / 100));
    return baseAmount - discountAmt;
  };

  // Calculate line item tax
  const calculateLineTax = (item: LineItem): number => {
    const subtotal = calculateLineSubtotal(item);
    return subtotal * (item.taxRate / 100);
  };

  // Calculate line item total
  const calculateLineTotal = (item: LineItem): number => {
    return calculateLineSubtotal(item) + calculateLineTax(item);
  };

  // Calculate overall subtotal (sum of all line subtotals before tax)
  const calculateSubtotal = (): number => {
    return lineItems.reduce((sum, item) => sum + calculateLineSubtotal(item), 0);
  };

  // Calculate overall tax
  const calculateTax = (): number => {
    return lineItems.reduce((sum, item) => sum + calculateLineTax(item), 0);
  };

  // Calculate grand total
  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax();
  };

  // Add new line item
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 0,
    };
    onChange([...lineItems, newItem]);
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    onChange(newItems);
  };

  // Update line item field
  const handleUpdateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const newItems = [...lineItems];
    // eslint-disable-next-line security/detect-object-injection
    newItems[index] = {
      // eslint-disable-next-line security/detect-object-injection
      ...newItems[index],
      [field]: value,
    };
    onChange(newItems);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" aria-hidden="true" />
              Line Items
            </CardTitle>
            <Button
              type="button"
              onClick={handleAddLineItem}
              disabled={disabled}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Add Line Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No line items added yet. Click &quot;Add Line Item&quot; to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      {/* Line Item Number and Remove Button */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-muted-foreground">
                          Line Item #{index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(index)}
                          disabled={disabled}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" />
                          Remove
                        </Button>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>
                          Description
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Input
                          id={`description-${index}`}
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateLineItem(index, "description", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </div>

                      {/* Quantity and Unit Price */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${index}`}>
                            Quantity
                            <span className="text-destructive ml-1">*</span>
                          </Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handleUpdateLineItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={disabled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`unit-price-${index}`}>
                            Unit Price
                            <span className="text-destructive ml-1">*</span>
                          </Label>
                          <Input
                            id={`unit-price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.unitPrice || ""}
                            onChange={(e) =>
                              handleUpdateLineItem(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={disabled}
                          />
                        </div>
                      </div>

                      {/* Discount and Tax */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`discount-${index}`}>
                            Discount (%)
                          </Label>
                          <Input
                            id={`discount-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            value={item.discountPercent || ""}
                            onChange={(e) =>
                              handleUpdateLineItem(
                                index,
                                "discountPercent",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={disabled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`tax-${index}`}>
                            Tax Rate (%)
                          </Label>
                          <Input
                            id={`tax-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            value={item.taxRate || ""}
                            onChange={(e) =>
                              handleUpdateLineItem(
                                index,
                                "taxRate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={disabled}
                          />
                        </div>
                      </div>

                      {/* Line Item Total */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">Line Total:</span>
                        <span className="text-lg font-bold">
                          {formatCurrency(calculateLineTotal(item))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
