
import { serial, text, pgTable, timestamp, numeric, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  category_id: integer('category_id').notNull(),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const cartItemsTable = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price_at_purchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
});

// Define relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  products: many(productsTable),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [productsTable.category_id],
    references: [categoriesTable.id],
  }),
  cartItems: many(cartItemsTable),
}));

export const cartItemsRelations = relations(cartItemsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [cartItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const ordersRelations = relations(ordersTable, ({ many }) => ({
  orderItems: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id],
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type CartItem = typeof cartItemsTable.$inferSelect;
export type NewCartItem = typeof cartItemsTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type NewOrderItem = typeof orderItemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  categories: categoriesTable, 
  products: productsTable, 
  cartItems: cartItemsTable,
  orders: ordersTable,
  orderItems: orderItemsTable
};
