
import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  category_id: z.number(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Cart item schema
export const cartItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  price: z.number(),
  created_at: z.coerce.date()
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Input schemas for creating
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  category_id: z.number(),
  image_url: z.string().url().nullable().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const addToCartInputSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().positive()
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

// Input schemas for updates
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  category_id: z.number().optional(),
  image_url: z.string().url().nullable().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const updateCartItemInputSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

// Search and filter schemas
export const searchProductsInputSchema = z.object({
  query: z.string().optional(),
  category_id: z.number().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional()
});

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;

// Product with category schema for joined queries
export const productWithCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  category_id: z.number(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  category: categorySchema
});

export type ProductWithCategory = z.infer<typeof productWithCategorySchema>;

// Cart item with product schema for joined queries
export const cartItemWithProductSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  price: z.number(),
  created_at: z.coerce.date(),
  product: productSchema
});

export type CartItemWithProduct = z.infer<typeof cartItemWithProductSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable(),
  total_amount: z.number(),
  status: z.string(),
  created_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

// Order item schema
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  price_at_purchase: z.number()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Create order input schema
export const createOrderInputSchema = z.object({
  cart_item_ids: z.array(z.number()).min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// Order with items schema for future use
export const orderWithItemsSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable(),
  total_amount: z.number(),
  status: z.string(),
  created_at: z.coerce.date(),
  orderItems: z.array(orderItemSchema)
});

export type OrderWithItems = z.infer<typeof orderWithItemsSchema>;
