"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { DimensionInput } from '@/components/ui/dimension-input';
import {
 type FurnitureType,
 getDimensionGroups,
 validateFurnitureDimensions,
 getRequiredFields
} from '@/lib/utils/dimension-validation';
import {
 type DualDimension,
 type DimensionUnit,
 dbToDualDimensions,
 dualDimensionToDb
} from '@/lib/utils/unit-conversion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface FurnitureDimension {
 [key: string]: DualDimension | null;
}

interface FurnitureDimensionsFormProps {
 itemId?: string;
 initialFurnitureType?: FurnitureType;
 initialDimensions?: Record<string, number>;
 onSave: (_data: {
 furniture_type: FurnitureType;
 dimensions: Record<string, number | null>;
 }) => Promise<void>;
 onCancel?: () => void;
 disabled?: boolean;
 className?: string;
}

export function FurnitureDimensionsForm({
 itemId: _itemId,
 initialFurnitureType,
 initialDimensions = {},
 onSave,
 onCancel,
 disabled = false,
 className,
}: FurnitureDimensionsFormProps) {
 const [furnitureType, setFurnitureType] = useState<FurnitureType | ''>('');
 const [dimensions, setDimensions] = useState<FurnitureDimension>({});
 const [userPreferredUnit, setUserPreferredUnit] = useState<DimensionUnit>('inches');
 const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Overall Dimensions']));
 const [isSaving, setIsSaving] = useState(false);
 const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[]; warnings: string[] }>({
 valid: true,
 errors: [],
 warnings: []
 });

 // Initialize form data
 useEffect(() => {
 if (initialFurnitureType) {
 setFurnitureType(initialFurnitureType);
 }

 // Convert initial dimensions to dual dimensions
 const initialDualDimensions: FurnitureDimension = {};
 for (const [field, value] of Object.entries(initialDimensions)) {
 if (value !== null && value !== undefined) {
 // Determine if this is an inches or cm field
 const unit = field.endsWith('_cm') ? 'cm' : 'inches';
 const baseField = field.replace('_inches', '').replace('_cm', '');

 // Look for the paired value
 const pairedField = unit === 'inches'
 ? `${baseField}_cm`
 : `${baseField}_inches`;
 const pairedValue = initialDimensions[pairedField as keyof typeof initialDimensions];

 // eslint-disable-next-line security/detect-object-injection
 initialDualDimensions[baseField] = dbToDualDimensions(
 unit === 'inches' ? value : pairedValue,
 unit === 'cm' ? value : pairedValue,
 'inches' // Always use inches as default for initial load to prevent infinite loop
 );
 }
 }
 setDimensions(initialDualDimensions);
 }, [initialFurnitureType, initialDimensions]); // Removed userPreferredUnit to prevent infinite loop

 // Validate dimensions when they change
 useEffect(() => {
 if (furnitureType) {
 // Convert dual dimensions to simple numbers for validation
 const validationData: Record<string, number | undefined> = {};

 for (const [field, dualDim] of Object.entries(dimensions)) {
 if (dualDim) {
 validationData[`${field}_inches` as keyof typeof validationData] = dualDim.inches;
 validationData[`${field}_cm` as keyof typeof validationData] = dualDim.cm;
 }
 }

 const result = validateFurnitureDimensions(furnitureType as FurnitureType, validationData);
 setValidationResult(result);
 }
 }, [furnitureType, dimensions]);

 const handleFurnitureTypeChange = (type: FurnitureType) => {
 setFurnitureType(type);
 // Clear dimensions when furniture type changes
 setDimensions({});
 // Auto-expand relevant groups
 const groups = getDimensionGroups(type);
 setExpandedGroups(new Set(Object.keys(groups).slice(0, 2))); // Expand first 2 groups
 };

 const handleDimensionChange = (field: string, value: DualDimension | null) => {
 setDimensions(prev => ({
 ...prev,
 [field]: value
 }));
 };

 const toggleGroup = (groupName: string) => {
 setExpandedGroups(prev => {
 const newSet = new Set(prev);
 if (newSet.has(groupName)) {
 newSet.delete(groupName);
 } else {
 newSet.add(groupName);
 }
 return newSet;
 });
 };

 const handleSave = async () => {
 if (!furnitureType) {
 return;
 }

 if (!validationResult.valid) {
 return;
 }

 setIsSaving(true);
 try {
 // Convert dual dimensions back to database format
 const dbDimensions: Record<string, number | null> = {};

 for (const [field, dualDim] of Object.entries(dimensions)) {
 const dbFormat = dualDimensionToDb(dualDim);
 // eslint-disable-next-line security/detect-object-injection
 dbDimensions[`${field}_inches` as keyof typeof dbDimensions] = dbFormat.inches;
 // eslint-disable-next-line security/detect-object-injection
 dbDimensions[`${field}_cm` as keyof typeof dbDimensions] = dbFormat.cm;
 }

 await onSave({
 furniture_type: furnitureType as FurnitureType,
 dimensions: dbDimensions,
 });
 } finally {
 setIsSaving(false);
 }
 };

 const getDimensionField = (field: string) => {
 const fieldName = field.replace('_inches', '').replace('_cm', '');
 // eslint-disable-next-line security/detect-object-injection
 const dimension = dimensions[fieldName];
 return dimension;
 };

 const renderDimensionInput = (field: string, isRequired: boolean, _groupName: string) => {
 const fieldName = field.replace('_inches', '').replace('_cm', '');
 const displayName = fieldName
 .split('_')
 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
 .join(' ');

 return (
 <DimensionInput
 key={fieldName}
 label={displayName}
 value={getDimensionField(field)}
 onChange={(value) => handleDimensionChange(fieldName, value)}
 defaultUnit={userPreferredUnit}
 required={isRequired}
 disabled={disabled}
 className="flex-1"
 />
 );
 };

 if (!furnitureType) {
 return (
 <Card className={className}>
 <CardHeader>
 <CardTitle className="text-lg font-semibold ">Furniture Dimensions</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium mb-2 block">
 Furniture Type <span className="text-destructive">*</span>
 </label>
 <Select value={furnitureType} onValueChange={handleFurnitureTypeChange} disabled={disabled}>
 <SelectTrigger>
 <SelectValue placeholder="Select furniture type" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="chair">Chair</SelectItem>
 <SelectItem value="bench">Bench</SelectItem>
 <SelectItem value="table">Table</SelectItem>
 <SelectItem value="sofa/loveseat">Sofa/Loveseat</SelectItem>
 <SelectItem value="sectional">Sectional</SelectItem>
 <SelectItem value="lounge">Lounge Chair</SelectItem>
 <SelectItem value="chaise_lounge">Chaise Lounge</SelectItem>
 <SelectItem value="ottoman">Ottoman</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </CardContent>
 </Card>
 );
 }

 const dimensionGroups = getDimensionGroups(furnitureType as FurnitureType);
 const requiredFields = getRequiredFields(furnitureType as FurnitureType);

 return (
 <Card className={className}>
 <CardHeader>
 <CardTitle className="text-lg font-semibold flex items-center justify-between">
 <span>Furniture Dimensions</span>
 <div className="flex items-center gap-2">
 <Badge variant={furnitureType ? "default" : "secondary"}>
 {furnitureType.charAt(0).toUpperCase() + furnitureType.slice(1)}
 </Badge>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => setUserPreferredUnit(userPreferredUnit === 'inches' ? 'cm' : 'inches')}
 className="h-6 px-2 text-xs"
 >
 {userPreferredUnit === 'inches' ? 'in' : 'cm'}
 </Button>
 </div>
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-6">
 {/* Furniture Type Selector */}
 <div>
 <label className="text-sm font-medium mb-2 block">
 Furniture Type <span className="text-destructive">*</span>
 </label>
 <Select value={furnitureType} onValueChange={handleFurnitureTypeChange} disabled={disabled}>
 <SelectTrigger>
 <SelectValue placeholder="Select furniture type" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="chair">Chair</SelectItem>
 <SelectItem value="bench">Bench</SelectItem>
 <SelectItem value="table">Table</SelectItem>
 <SelectItem value="sofa/loveseat">Sofa/Loveseat</SelectItem>
 <SelectItem value="sectional">Sectional</SelectItem>
 <SelectItem value="lounge">Lounge Chair</SelectItem>
 <SelectItem value="chaise_lounge">Chaise Lounge</SelectItem>
 <SelectItem value="ottoman">Ottoman</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Validation Status */}
 {validationResult.errors.length > 0 && (
 <div className="flex items-start gap-2 p-3 bg-destructive/20 border border-destructive rounded-lg">
 <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
 <div className="text-sm text-destructive">
 <p className="font-medium mb-1">Validation Errors:</p>
 <ul className="list-disc list-inside space-y-1">
 {validationResult.errors.map((error, index) => (
 <li key={index}>{error}</li>
 ))}
 </ul>
 </div>
 </div>
 )}

 {validationResult.warnings.length > 0 && (
 <div className="flex items-start gap-2 p-3 bg-warning/20 border border-warning rounded-lg">
 <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
 <div className="text-sm text-warning">
 <p className="font-medium mb-1">Warnings:</p>
 <ul className="list-disc list-inside space-y-1">
 {validationResult.warnings.map((warning, index) => (
 <li key={index}>{warning}</li>
 ))}
 </ul>
 </div>
 </div>
 )}

 {validationResult.valid && validationResult.errors.length === 0 && Object.keys(dimensions).length > 0 && (
 <div className="flex items-center gap-2 p-3 bg-success/20 border border-success rounded-lg">
 <CheckCircle className="h-4 w-4 text-success" />
 <span className="text-sm text-success">All dimensions are valid</span>
 </div>
 )}

 {/* Dimension Groups */}
 <div className="space-y-4">
 {Object.entries(dimensionGroups).map(([groupName, fields]) => (
 <Collapsible
 key={groupName}
 open={expandedGroups.has(groupName)}
 onOpenChange={() => toggleGroup(groupName)}
 >
 <CollapsibleTrigger asChild>
 <Button
 variant="ghost"
 className="w-full justify-between p-3 h-auto card/50 hover:card/50"
 >
 <span className="text-sm font-medium ">{groupName}</span>
 {expandedGroups.has(groupName) ? (
 <ChevronDown className="h-4 w-4" />
 ) : (
 <ChevronRight className="h-4 w-4" />
 )}
 </Button>
 </CollapsibleTrigger>
 <CollapsibleContent>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-3 pt-4">
 {fields.map((field) => {
 const isRequired = requiredFields.includes(field);
 return renderDimensionInput(field, isRequired, groupName);
 })}
 </div>
 </CollapsibleContent>
 </Collapsible>
 ))}
 </div>

 {/* Actions */}
 <div className="flex gap-2 pt-4 border-t border">
 {onCancel && (
 <Button
 type="button"
 variant="outline"
 onClick={onCancel}
 disabled={disabled || isSaving}
 >
 Cancel
 </Button>
 )}
 <Button
 type="button"
 onClick={handleSave}
 disabled={disabled || isSaving || !validationResult.valid}
 className="bg-info hover:bg-info"
 >
 {isSaving ? 'Saving...' : 'Save Dimensions'}
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 );
}

export default FurnitureDimensionsForm;