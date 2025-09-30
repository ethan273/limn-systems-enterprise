"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  type FurnitureType,
  getDimensionGroups,
  isFieldRelevant
} from '@/lib/utils/dimension-validation';
import {
  type DualDimension,
  type DimensionUnit,
  formatDimension,
  dbToDualDimensions
} from '@/lib/utils/unit-conversion';
import { Ruler, Package, Home } from 'lucide-react';

interface DimensionDisplayProps {
  furnitureType?: FurnitureType;
  dimensions?: Record<string, number | null>;
  preferredUnit?: DimensionUnit;
  showEmpty?: boolean;
  compact?: boolean;
  className?: string;
}

export function DimensionDisplay({
  furnitureType,
  dimensions = {},
  preferredUnit = 'inches',
  showEmpty = false,
  compact = false,
  className,
}: DimensionDisplayProps) {
  if (!furnitureType) {
    return (
      <Card className={`bg-gray-900 border-gray-700 ${className}`}>
        <CardContent className="p-6 text-center">
          <Ruler className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400">No furniture type specified</p>
        </CardContent>
      </Card>
    );
  }

  const dimensionGroups = getDimensionGroups(furnitureType);

  // Convert database dimensions to dual dimensions for display
  const dualDimensions: Record<string, DualDimension | null> = {};
  const specialValues: Record<string, any> = {};

  // Define special fields that don't follow _inches/_cm pattern
  const specialFields = ['weight_capacity', 'swivel_range', 'backrest_angle', 'adjustable_positions', 'chaise_orientation'];

  // Process special non-dimension fields
  Object.entries(dimensions).forEach(([field, value]) => {
    if (value !== null && value !== undefined && specialFields.includes(field)) {
      // eslint-disable-next-line security/detect-object-injection
      specialValues[field] = value;
    }
  });

  // Process weight separately
  const weightLbs = dimensions['weight_lbs_new' as keyof typeof dimensions];
  const weightKg = dimensions['weight_kg' as keyof typeof dimensions];
  if (weightLbs !== null && weightLbs !== undefined) {
    dualDimensions['weight'] = {
      inches: weightLbs, // Store lbs in inches field for display
      cm: weightKg ?? Math.round(weightLbs * 0.453592 * 100) / 100,
      originalUnit: 'inches' // Use inches to represent lbs
    };
  }

  // Create a mapping of base dimension names to their inch/cm pairs
  const processedPairs = new Set<string>();

  Object.entries(dimensions).forEach(([field, value]) => {
    if (value === null || value === undefined) return;
    if (specialFields.includes(field) || field.includes('weight')) return;

    // Extract base name and unit from field
    let baseName = '';
    let unit: 'inches' | 'cm' | null = null;

    if (field.endsWith('_inches')) {
      baseName = field.replace('_inches', '');
      unit = 'inches';
    } else if (field.endsWith('_cm')) {
      baseName = field.replace('_cm', '');
      unit = 'cm';
    }

    if (!baseName || !unit || processedPairs.has(baseName)) return;

    // Look for the corresponding pair
    const inchesField = baseName + '_inches';
    const cmField = baseName + '_cm';

    const inchesValue = dimensions[inchesField as keyof typeof dimensions];
    const cmValue = dimensions[cmField as keyof typeof dimensions];

    // Only create dual dimension if we have at least one value
    if (inchesValue !== null && inchesValue !== undefined ||
        cmValue !== null && cmValue !== undefined) {

      // eslint-disable-next-line security/detect-object-injection
      dualDimensions[inchesField] = dbToDualDimensions(
        inchesValue ?? undefined,
        cmValue ?? undefined,
        preferredUnit
      );

      processedPairs.add(baseName);
    }
  });

  const renderDimensionValue = (field: string) => {
    const dimension = dualDimensions[field as keyof typeof dualDimensions];

    // Handle special weight field
    if (field === 'weight_lbs_new' || field === 'weight') {
      const weightDimension = dualDimensions['weight'];
      if (weightDimension) {
        if (compact) {
          return (
            <div className="text-sm">
              <span className="font-medium text-gray-100">
                {weightDimension.inches} lbs
              </span>
            </div>
          );
        }
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-100">
              {weightDimension.inches} lbs
            </div>
            <div className="text-xs text-gray-400">
              {weightDimension.cm?.toFixed(1)} kg
            </div>
          </div>
        );
      }
    }

    // Handle special non-dimension fields
    if (specialFields.includes(field)) {
      const value = specialValues[field as keyof typeof specialValues];
      if (value !== undefined && value !== null) {
        let displayValue = value;
        if (field === 'swivel_range') displayValue = `${value}°`;
        if (field === 'backrest_angle') displayValue = `${value}°`;
        if (field === 'weight_capacity') displayValue = `${value} lbs`;

        return (
          <div className="text-sm font-medium text-gray-100">
            {displayValue}
          </div>
        );
      }
      if (showEmpty) {
        return (
          <div className="text-sm text-gray-500">
            Not specified
          </div>
        );
      }
      return null;
    }

    if (!dimension) {
      if (showEmpty) {
        return (
          <div className="text-sm text-gray-500">
            Not specified
          </div>
        );
      }
      return null;
    }

    const primaryValue = preferredUnit === 'inches' ? dimension.inches : dimension.cm;
    const secondaryValue = preferredUnit === 'inches' ? dimension.cm : dimension.inches;

    if (compact) {
      return (
        <div className="text-sm">
          <span className="font-medium text-gray-100">
            {formatDimension(primaryValue, preferredUnit)}
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-100">
          {formatDimension(primaryValue, preferredUnit)}
        </div>
        <div className="text-xs text-gray-400">
          {formatDimension(secondaryValue, preferredUnit === 'inches' ? 'cm' : 'inches')}
        </div>
      </div>
    );
  };

  const renderDimensionField = (field: string, groupName: string) => {
    // Custom display names for better readability
    const customNames: Record<string, string> = {
      'weight_lbs_new': 'Weight',
      'weight': 'Weight',
      'clearance_required_new_inches': 'Space Required',
      'clearance_required_new_cm': 'Space Required',
      'doorway_clearance_new_inches': 'Doorway Width Needed',
      'doorway_clearance_new_cm': 'Doorway Width Needed',
      'diagonal_depth_new_inches': 'Diagonal Measurement',
      'diagonal_depth_new_cm': 'Diagonal Measurement',
      'material_thickness_new_inches': 'Material Thickness',
      'material_thickness_new_cm': 'Material Thickness',
      'folded_width_inches': 'Folded Width',
      'folded_depth_inches': 'Folded Depth',
      'folded_height_inches': 'Folded Height',
      'stacking_height_inches': 'Stacked Height',
      'weight_capacity': 'Weight Capacity',
      'swivel_range': 'Swivel Range',
      'backrest_angle': 'Backrest Angle',
      'adjustable_positions': 'Adjustable Positions',
      'chaise_orientation': 'Chaise Orientation',
      'zero_wall_clearance_inches': 'Wall Clearance',
      'cushion_thickness_compressed_inches': 'Cushion Compressed',
      'cushion_thickness_uncompressed_inches': 'Cushion Uncompressed',
      'width_across_arms_inches': 'Width Across Arms',
      'table_top_thickness_inches': 'Top Thickness',
      'leg_section_length_inches': 'Leg Section Length',
      'clearance_height_inches': 'Clearance Height',
      'back_height_inches': 'Back Height',
      'overall_assembled_width_inches': 'Assembled Width',
      'overall_assembled_depth_inches': 'Assembled Depth',
      'min_configuration_width_inches': 'Min Configuration Width',
      'max_configuration_width_inches': 'Max Configuration Width',
      'rock_glide_depth_inches': 'Rock/Glide Depth'
    };

    const displayName = customNames[field as keyof typeof customNames] ||
      field.replace(/_inches$|_cm$|_new$/g, '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // For weight field, check the special 'weight' key
    let dimension = dualDimensions[field as keyof typeof dualDimensions];
    if (field === 'weight_lbs_new') {
      dimension = dualDimensions['weight'];
    }

    const specialValue = specialValues[field as keyof typeof specialValues];

    // Check if we have any data to display
    const hasData = dimension || specialValue !== undefined;

    if (!hasData && !showEmpty) {
      return null;
    }

    return (
      <div key={`${groupName}-${field}`} className="space-y-1">
        <Label className="text-xs text-gray-400">{displayName}</Label>
        {renderDimensionValue(field)}
      </div>
    );
  };

  const renderGroup = (groupName: string, fields: string[]) => {
    // For universal measurements, show all fields regardless of furniture type
    const relevantFields = groupName === 'Universal Measurements'
      ? fields
      : fields.filter(field => isFieldRelevant(furnitureType, field));

    const hasAnyDimensions = relevantFields.some(field => {
      if (field === 'weight_lbs_new') {
        return dualDimensions['weight'];
      }
      if (specialFields.includes(field)) {
        return specialValues[field as keyof typeof specialValues] !== undefined;
      }
      return dualDimensions[field as keyof typeof dualDimensions];
    });

    if (!hasAnyDimensions && !showEmpty) {
      return null;
    }

    const fieldsWithData = relevantFields.filter(field => {
      if (field === 'weight_lbs_new') {
        return dualDimensions['weight'];
      }
      if (specialFields.includes(field)) {
        return specialValues[field as keyof typeof specialValues] !== undefined;
      }
      return dualDimensions[field as keyof typeof dualDimensions];
    });

    return (
      <div key={groupName} className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-200">{groupName}</h4>
          {hasAnyDimensions && (
            <Badge variant="outline" className="text-xs">
              {fieldsWithData.length}/{relevantFields.length}
            </Badge>
          )}
        </div>

        <div className={`grid gap-3 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {relevantFields.map(field => renderDimensionField(field, groupName))}
        </div>
      </div>
    );
  };

  const hasAnyDimensions = Object.values(dualDimensions).some(d => d !== null) || Object.keys(specialValues).length > 0;

  if (!hasAnyDimensions && !showEmpty) {
    return (
      <Card className={`bg-gray-900 border-gray-700 ${className}`}>
        <CardContent className="p-6 text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400">No dimensions specified</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Object.entries(dimensionGroups).map(([groupName, fields]) =>
          renderGroup(groupName, fields)
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-200 flex items-center gap-2">
          <Home className="h-5 w-5" />
          <span>
            {furnitureType.charAt(0).toUpperCase() + furnitureType.slice(1)} Dimensions
          </span>
          <Badge variant="outline" className="text-xs">
            {preferredUnit === 'inches' ? 'Imperial' : 'Metric'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(dimensionGroups).map(([groupName, fields]) =>
          renderGroup(groupName, fields)
        )}

        {!hasAnyDimensions && showEmpty && (
          <div className="text-center py-8">
            <Ruler className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">No dimensions have been set for this {furnitureType}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DimensionDisplay;