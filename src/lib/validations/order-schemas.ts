/**
 * Order Form Validation Schemas
 *
 * Zod schemas for client-side form validation that align with database constraints
 * from Phase 2. Frontend validation is STRICTER than database to provide better UX.
 *
 * Database Constraints (Phase 2):
 * - orders_must_have_customer_or_project: customer_id OR project_id required
 * - orders_total_amount_positive: total_amount >= 0 or NULL
 * - production_orders_total_cost_positive: total_cost >= 0 or NULL
 * - production_orders_deposit_amount_positive: deposit_amount >= 0 or NULL
 *
 * Frontend enforces BOTH customer_id AND project_id for better data quality.
 */

import { z } from 'zod';

// ============================================================================
// ORDER VALIDATION SCHEMAS
// ============================================================================

/**
 * Order Item Schema
 * Validates individual items within an order
 */
export const orderItemSchema = z.object({
  product_name: z
    .string()
    .min(1, { message: 'Product name is required' })
    .max(255, { message: 'Product name must be less than 255 characters' }),

  product_sku: z
    .string()
    .min(1, { message: 'Product SKU is required' }),

  project_sku: z
    .string()
    .min(1, { message: 'Project SKU is required' }),

  base_sku: z
    .string()
    .min(1, { message: 'Base SKU is required' }),

  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int({ message: 'Quantity must be a whole number' })
    .min(1, { message: 'Quantity must be at least 1' })
    .max(999999, { message: 'Quantity cannot exceed 999,999' }),

  unit_price: z
    .number({ required_error: 'Unit price is required' })
    .min(0, { message: 'Price cannot be negative' })
    .max(999999.99, { message: 'Price cannot exceed $999,999.99' }),

  total_price: z
    .number({ required_error: 'Total price is required' })
    .min(0, { message: 'Total price cannot be negative' }),

  material_selections: z.any().optional(),

  custom_specifications: z
    .string()
    .max(2000, { message: 'Specifications must be less than 2000 characters' })
    .optional(),
});

/**
 * Create Order Schema
 * Used for new order creation forms
 * Stricter than database: requires BOTH customer_id AND project_id
 */
export const createOrderSchema = z.object({
  customer_id: z
    .string({ required_error: 'Please select a client' })
    .uuid({ message: 'Invalid client selection' }),

  project_id: z
    .string({ required_error: 'Please select a project' })
    .uuid({ message: 'Invalid project selection' }),

  collection_id: z
    .string()
    .uuid({ message: 'Invalid collection selection' })
    .optional(),

  order_items: z
    .array(orderItemSchema)
    .min(1, { message: 'At least one item is required' })
    .max(100, { message: 'Cannot add more than 100 items' }),

  priority: z
    .enum(['low', 'normal', 'high', 'urgent'], {
      message: 'Please select a valid priority level',
    })
    .default('normal'),

  notes: z
    .string()
    .max(2000, { message: 'Notes must be less than 2000 characters' })
    .optional(),
});

/**
 * Update Order Schema
 * Used for order edit forms
 * All fields optional (partial updates)
 */
export const updateOrderSchema = createOrderSchema.partial();

/**
 * Order Status Update Schema
 * Validates status transitions
 */
export const updateOrderStatusSchema = z.object({
  orderId: z
    .string()
    .uuid({ message: 'Invalid order ID' }),

  status: z.enum([
    'draft',
    'pending',
    'confirmed',
    'in_production',
    'quality_check',
    'ready_to_ship',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
  ], {
    message: 'Please select a valid status',
  }),

  notes: z
    .string()
    .max(500, { message: 'Notes must be less than 500 characters' })
    .optional(),
});

// ============================================================================
// PRODUCTION ORDER VALIDATION SCHEMAS
// ============================================================================

/**
 * Create Production Order Schema
 * Used for new production order creation forms
 */
export const createProductionOrderSchema = z.object({
  order_id: z
    .string()
    .uuid({ message: 'Invalid order selection' })
    .optional(),

  project_id: z
    .string()
    .uuid({ message: 'Invalid project selection' })
    .optional(),

  product_type: z.enum(['catalog', 'prototype', 'concept'], {
    required_error: 'Please select a product type',
    message: 'Please select a valid product type',
  }),

  catalog_item_id: z
    .string()
    .uuid({ message: 'Invalid catalog item selection' })
    .optional(),

  prototype_id: z
    .string()
    .uuid({ message: 'Invalid prototype selection' })
    .optional(),

  concept_id: z
    .string()
    .uuid({ message: 'Invalid concept selection' })
    .optional(),

  item_name: z
    .string({ required_error: 'Item name is required' })
    .min(1, { message: 'Item name is required' })
    .max(255, { message: 'Item name must be less than 255 characters' }),

  item_description: z
    .string()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional(),

  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int({ message: 'Quantity must be a whole number' })
    .min(1, { message: 'Quantity must be at least 1' })
    .max(999999, { message: 'Quantity cannot exceed 999,999' }),

  unit_price: z
    .number({ required_error: 'Unit price is required' })
    .min(0, { message: 'Price cannot be negative' })
    .max(999999.99, { message: 'Price cannot exceed $999,999.99' }),

  estimated_ship_date: z
    .date()
    .min(new Date(), { message: 'Ship date cannot be in the past' })
    .optional(),

  factory_id: z
    .string()
    .uuid({ message: 'Invalid factory selection' })
    .optional(),

  factory_notes: z
    .string()
    .max(1000, { message: 'Factory notes must be less than 1000 characters' })
    .optional(),
});

/**
 * Update Production Order Schema
 * Used for production order edit forms
 * All fields optional (partial updates)
 */
export const updateProductionOrderSchema = createProductionOrderSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OrderItemFormData = z.infer<typeof orderItemSchema>;
export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusFormData = z.infer<typeof updateOrderStatusSchema>;
export type CreateProductionOrderFormData = z.infer<typeof createProductionOrderSchema>;
export type UpdateProductionOrderFormData = z.infer<typeof updateProductionOrderSchema>;
