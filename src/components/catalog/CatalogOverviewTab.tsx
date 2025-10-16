"use client";

/**
 * Catalog Overview Tab Component
 *
 * Displays:
 * - Product image carousel
 * - Complete specifications table
 * - Furniture dimensions (dual units: inches + cm)
 * - Base SKU with explanation
 * - Collection link (clickable)
 * - List price
 * - Status badges
 *
 * Created: October 2, 2025
 */

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DimensionDisplay } from "@/components/furniture/DimensionDisplay";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api/client";
import { EditableField, SpecificationsManager } from "@/components/common";

interface CatalogOverviewTabProps {
  catalogItem: any; // Full catalog item with relations
  isEditing?: boolean;
}

export default function CatalogOverviewTab({ catalogItem, isEditing = false }: CatalogOverviewTabProps) {
  const utils = api.useUtils();
  const {
    id,
    name,
    description,
    base_sku,
    list_price,
    currency,
    collections,
    furniture_type,
    category,
    subcategory,
    lead_time_days,
    min_order_quantity,
    is_customizable,
    furniture_dimensions,
    item_images,
    specifications,
  } = catalogItem;

  // Update mutation
  const updateMutation = api.items.update.useMutation({
    onSuccess: () => {
      // Use tRPC utils for proper invalidation
      utils.items.getCatalogItemById.invalidate({ itemId: id });
      utils.items.getAll.invalidate();
    },
  });

  const handleSaveSpecifications = async (specs: Record<string, any>) => {
    // TODO: Update router to support specifications field update
    // For now, specifications are stored but not updated via this mutation
    console.log('Specifications update requested:', specs);
    // await updateMutation.mutateAsync({
    //   id,
    //   data: { specifications: specs },
    // });
  };

  return (
    <div className="catalog-overview-tab">
      <div className="overview-grid">
        {/* Left Column: Images */}
        <div className="overview-images-section">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                {item_images?.length || 0} image(s) available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {item_images && item_images.length > 0 ? (
                <div className="image-carousel">
                  {/* Primary Image */}
                  {item_images.find((img: any) => img.is_primary) && (
                    <div className="primary-image-container">
                      <Image
                        src={item_images.find((img: any) => img.is_primary).file_url}
                        alt={name}
                        fill
                        className="primary-image"
                        style={{ objectFit: "cover" }}
                      />
                      <Badge className="primary-badge">Primary</Badge>
                    </div>
                  )}

                  {/* Additional Images */}
                  {item_images.filter((img: any) => !img.is_primary).length > 0 && (
                    <div className="additional-images-grid">
                      {item_images
                        .filter((img: any) => !img.is_primary)
                        .map((image: any) => (
                          <div key={image.id} className="thumbnail-container">
                            <Image
                              src={image.file_url}
                              alt={image.alt_text || name}
                              fill
                              className="thumbnail-image"
                              style={{ objectFit: "cover" }}
                            />
                            {image.image_type && (
                              <Badge variant="outline" className="image-type-badge">
                                {image.image_type.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-state-text">No images available</p>
                  <p className="empty-state-subtext">Upload images to showcase this product</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Specifications */}
        <div className="overview-specs-section">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Core product details and identification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="specs-table">
                <div className="spec-row">
                  <span className="spec-label">Product Name</span>
                  <EditableField
                    value={name}
                    isEditing={isEditing}
                    onChange={(newValue) =>
                      updateMutation.mutate({
                        id,
                        data: { name: newValue },
                      })
                    }
                    type="text"
                    className="spec-value"
                  />
                </div>

                {base_sku && (
                  <div className="spec-row highlight">
                    <span className="spec-label">
                      Base SKU
                      <Badge variant="secondary" className="ml-2">Catalog</Badge>
                    </span>
                    <span className="spec-value base-sku-value">{base_sku}</span>
                  </div>
                )}

                {collections && (
                  <div className="spec-row">
                    <span className="spec-label">Collection</span>
                    <span className="spec-value">
                      <Link href={`/products/collections/${collections.id}`} className="collection-link">
                        {collections.name}
                        <ExternalLink className="link-icon" />
                      </Link>
                    </span>
                  </div>
                )}

                {furniture_type && (
                  <div className="spec-row">
                    <span className="spec-label">Furniture Type</span>
                    <span className="spec-value">{furniture_type.replace(/_/g, " ")}</span>
                  </div>
                )}

                {category && (
                  <div className="spec-row">
                    <span className="spec-label">Category</span>
                    <EditableField
                      value={category}
                      isEditing={isEditing}
                      onChange={(newValue) =>
                        updateMutation.mutate({
                          id,
                          data: { category: newValue },
                        })
                      }
                      type="text"
                      className="spec-value"
                    />
                  </div>
                )}

                {subcategory && (
                  <div className="spec-row">
                    <span className="spec-label">Subcategory</span>
                    <EditableField
                      value={subcategory}
                      isEditing={isEditing}
                      onChange={(newValue) =>
                        updateMutation.mutate({
                          id,
                          data: { subcategory: newValue },
                        })
                      }
                      type="text"
                      className="spec-value"
                    />
                  </div>
                )}

                <div className="spec-row">
                  <span className="spec-label">List Price</span>
                  <EditableField
                    value={list_price}
                    isEditing={isEditing}
                    onChange={(newValue) =>
                      updateMutation.mutate({
                        id,
                        data: { list_price: parseFloat(newValue) },
                      })
                    }
                    type="number"
                    className="spec-value price"
                    prefix="$"
                    suffix={currency || "USD"}
                  />
                </div>

                {lead_time_days && (
                  <div className="spec-row">
                    <span className="spec-label">Lead Time</span>
                    <EditableField
                      value={lead_time_days}
                      isEditing={isEditing}
                      onChange={(newValue) =>
                        updateMutation.mutate({
                          id,
                          data: { lead_time_days: parseInt(newValue) },
                        })
                      }
                      type="number"
                      className="spec-value"
                      suffix="days"
                    />
                  </div>
                )}

                {min_order_quantity && (
                  <div className="spec-row">
                    <span className="spec-label">Minimum Order Qty</span>
                    <EditableField
                      value={min_order_quantity}
                      isEditing={isEditing}
                      onChange={(newValue) =>
                        updateMutation.mutate({
                          id,
                          data: { min_order_quantity: parseInt(newValue) },
                        })
                      }
                      type="number"
                      className="spec-value"
                      suffix="unit(s)"
                    />
                  </div>
                )}

                <div className="spec-row">
                  <span className="spec-label">Customizable</span>
                  <span className="spec-value">
                    {is_customizable ? (
                      <Badge className="badge-success">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <EditableField
                value={description || ''}
                isEditing={isEditing}
                onChange={(newValue) =>
                  updateMutation.mutate({
                    id,
                    data: { description: newValue || undefined },
                  })
                }
                type="textarea"
                className="product-description"
                placeholder="Add a product description..."
              />
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Product-specific details and attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <SpecificationsManager
                specifications={specifications || {}}
                onSave={handleSaveSpecifications}
                isEditing={isEditing}
              />
            </CardContent>
          </Card>

          {/* Dimensions */}
          {furniture_dimensions && furniture_type && (
            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
                <CardDescription>All measurements in inches and centimeters</CardDescription>
              </CardHeader>
              <CardContent>
                <DimensionDisplay
                  dimensions={furniture_dimensions}
                  furnitureType={furniture_type}
                />
              </CardContent>
            </Card>
          )}

          {/* Full SKU Explanation */}
          <Card className="sku-explainer-card">
            <CardHeader>
              <CardTitle>About Base SKU vs Full SKU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="sku-explainer">
                <div className="explainer-section">
                  <h4 className="explainer-title">Base SKU (Catalog Level)</h4>
                  <p className="explainer-text">
                    <strong>{base_sku || "Not assigned"}</strong> - Identifies this catalog item ready for production.
                    This is the SKU you see in the catalog before any material selections are made.
                  </p>
                </div>

                <div className="explainer-section">
                  <h4 className="explainer-title">Full SKU (Order Level)</h4>
                  <p className="explainer-text">
                    Generated when a sales rep creates an order with specific material selections.
                    Format: <code className="sku-format">{base_sku || "BASE"}-FAB-NAV-WOD-OAK-...</code>
                  </p>
                  <p className="explainer-subtext">
                    Full SKUs are created at order time and stored for manufacturing, sales analytics, and client communication.
                    View the <strong>Sales Analytics</strong> tab to see all Full SKU combinations for this item.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
