import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { getSupabaseAdmin } from '@/lib/supabase';

// Order Item Schema
const createOrderItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  collection_id: z.string().uuid().optional(),
  fabric_brand: z.string().optional(),
  fabric_collection: z.string().optional(),
  fabric_color: z.string().optional(),
  wood_type: z.string().optional(),
  wood_finish: z.string().optional(),
  metal_type: z.string().optional(),
  metal_finish: z.string().optional(),
  metal_color: z.string().optional(),
  stone_type: z.string().optional(),
  stone_finish: z.string().optional(),
  weaving_material: z.string().optional(),
  weaving_pattern: z.string().optional(),
  weaving_color: z.string().optional(),
  carving_style: z.string().optional(),
  carving_pattern: z.string().optional(),
  custom_specifications: z.string().optional(),
  status: z.enum(['pending', 'in_production', 'ready', 'delivered', 'cancelled']).default('pending'),
  estimated_delivery: z.string().optional(),
  notes: z.string().optional(),
});

const updateOrderItemSchema = createOrderItemSchema.partial();

export const orderItemsRouter = createTRPCRouter({
  // Get all order items
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
      collection_id: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      let query = supabase
        .from('order_items')
        .select(`
          *,
          orders(
            id,
            order_number,
            customer_id,
            status,
            created_at,
            customers(
              id,
              name,
              company_name
            )
          )
        `);

      // Apply filters
      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.search && input.search.trim()) {
        query = query.or(`description.ilike.%${input.search}%,project_sku.ilike.%${input.search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new Error(`Failed to fetch order items: ${error.message}`);
      }

      return {
        items: data || [],
        total: count || 0,
      };
    }),

  // Create order item
  create: protectedProcedure
    .input(createOrderItemSchema)
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      // First create an order if needed
      const orderCount = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });

      const orderNumber = `ORD-${((orderCount.count || 0) + 1).toString().padStart(6, '0')}`;

      // Create a basic order first (you may want to modify this based on your needs)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: '00000000-0000-0000-0000-000000000001', // Default customer ID - you may want to make this dynamic
          status: 'pending',
          total_amount: input.quantity * input.unit_price,
          created_by: 'system',
        } as any)
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // Create the order item
      const orderItemData = {
        order_id: (order as any)?.id,
        quantity: input.quantity,
        unit_price: input.unit_price,
        description: input.product_name,
        specifications: {
          fabric_brand: input.fabric_brand,
          fabric_collection: input.fabric_collection,
          fabric_color: input.fabric_color,
          wood_type: input.wood_type,
          wood_finish: input.wood_finish,
          metal_type: input.metal_type,
          metal_finish: input.metal_finish,
          metal_color: input.metal_color,
          stone_type: input.stone_type,
          stone_finish: input.stone_finish,
          weaving_material: input.weaving_material,
          weaving_pattern: input.weaving_pattern,
          weaving_color: input.weaving_color,
          carving_style: input.carving_style,
          carving_pattern: input.carving_pattern,
          custom_specifications: input.custom_specifications,
          estimated_delivery: input.estimated_delivery,
          notes: input.notes,
        },
        status: input.status,
      };

      const { data: orderItem, error } = await supabase
        .from('order_items')
        .insert(orderItemData as any)
        .select(`
          *,
          orders(
            id,
            order_number,
            customer_id,
            customers(
              id,
              name,
              company_name
            )
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create order item: ${error.message}`);
      }

      return orderItem;
    }),

  // Update order item
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateOrderItemSchema,
    }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      // Get current item to merge specifications
      const { data: currentItem } = await supabase
        .from('order_items')
        .select('specifications')
        .eq('id', input.id)
        .single();

      const updateData: any = {
        status: input.data.status,
      };

      if (input.data.quantity !== undefined) updateData.quantity = input.data.quantity;
      if (input.data.unit_price !== undefined) updateData.unit_price = input.data.unit_price;
      if (input.data.product_name !== undefined) updateData.description = input.data.product_name;

      // Update specifications
      if (Object.keys(input.data).some(key => !['quantity', 'unit_price', 'product_name', 'status'].includes(key))) {
        const currentSpecs = ((currentItem as any)?.specifications as any) || {};
        const newSpecs = {
          ...currentSpecs,
          fabric_brand: input.data.fabric_brand ?? currentSpecs.fabric_brand,
          fabric_collection: input.data.fabric_collection ?? currentSpecs.fabric_collection,
          fabric_color: input.data.fabric_color ?? currentSpecs.fabric_color,
          wood_type: input.data.wood_type ?? currentSpecs.wood_type,
          wood_finish: input.data.wood_finish ?? currentSpecs.wood_finish,
          metal_type: input.data.metal_type ?? currentSpecs.metal_type,
          metal_finish: input.data.metal_finish ?? currentSpecs.metal_finish,
          metal_color: input.data.metal_color ?? currentSpecs.metal_color,
          stone_type: input.data.stone_type ?? currentSpecs.stone_type,
          stone_finish: input.data.stone_finish ?? currentSpecs.stone_finish,
          weaving_material: input.data.weaving_material ?? currentSpecs.weaving_material,
          weaving_pattern: input.data.weaving_pattern ?? currentSpecs.weaving_pattern,
          weaving_color: input.data.weaving_color ?? currentSpecs.weaving_color,
          carving_style: input.data.carving_style ?? currentSpecs.carving_style,
          carving_pattern: input.data.carving_pattern ?? currentSpecs.carving_pattern,
          custom_specifications: input.data.custom_specifications ?? currentSpecs.custom_specifications,
          estimated_delivery: input.data.estimated_delivery ?? currentSpecs.estimated_delivery,
          notes: input.data.notes ?? currentSpecs.notes,
        };
        updateData.specifications = newSpecs;
      }

      // @ts-ignore: Supabase types not properly inferred for order_items update
      const orderItemsTable = supabase.from('order_items');
      const { data: orderItem, error } = await (orderItemsTable as any)
        .update(updateData)
        .eq('id', input.id)
        .select(`
          *,
          orders(
            id,
            order_number,
            customer_id,
            customers(
              id,
              name,
              company_name
            )
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update order item: ${error.message}`);
      }

      return orderItem;
    }),

  // Delete order item
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new Error(`Failed to delete order item: ${error.message}`);
      }

      return { success: true };
    }),

  // Get order item by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data: orderItem, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders(
            id,
            order_number,
            customer_id,
            customers(
              id,
              name,
              company_name
            )
          )
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch order item: ${error.message}`);
      }

      return orderItem;
    }),
});