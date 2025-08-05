import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable, cartItemsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an order with items and update stock', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 10,
        category_id: category.id,
        image_url: null
      })
      .returning()
      .execute();
    const product = productResult[0];

    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: product.id,
        quantity: 2,
        price: '19.99'
      })
      .returning()
      .execute();
    const cartItem = cartItemResult[0];

    const input: CreateOrderInput = {
      cart_item_ids: [cartItem.id]
    };

    // Execute the handler
    const result = await createOrder(input);

    // Verify order creation
    expect(result.id).toBeDefined();
    expect(result.user_id).toBeNull();
    expect(result.total_amount).toEqual(39.98); // 2 * 19.99
    expect(result.status).toEqual('completed');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify order exists in database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();
    
    expect(orders).toHaveLength(1);
    expect(parseFloat(orders[0].total_amount)).toEqual(39.98);

    // Verify order items were created
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();
    
    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].product_id).toEqual(product.id);
    expect(orderItems[0].quantity).toEqual(2);
    expect(parseFloat(orderItems[0].price_at_purchase)).toEqual(19.99);

    // Verify stock was updated
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();
    
    expect(updatedProducts[0].stock_quantity).toEqual(8); // 10 - 2

    // Verify cart item was removed
    const remainingCartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem.id))
      .execute();
    
    expect(remainingCartItems).toHaveLength(0);
  });

  it('should handle multiple cart items', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'First product',
        price: '10.00',
        stock_quantity: 5,
        category_id: category.id,
        image_url: null
      })
      .returning()
      .execute();
    const product1 = product1Result[0];

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Second product',
        price: '15.50',
        stock_quantity: 8,
        category_id: category.id,
        image_url: null
      })
      .returning()
      .execute();
    const product2 = product2Result[0];

    const cartItem1Result = await db.insert(cartItemsTable)
      .values({
        product_id: product1.id,
        quantity: 2,
        price: '10.00'
      })
      .returning()
      .execute();
    const cartItem1 = cartItem1Result[0];

    const cartItem2Result = await db.insert(cartItemsTable)
      .values({
        product_id: product2.id,
        quantity: 1,
        price: '15.50'
      })
      .returning()
      .execute();
    const cartItem2 = cartItem2Result[0];

    const input: CreateOrderInput = {
      cart_item_ids: [cartItem1.id, cartItem2.id]
    };

    // Execute the handler
    const result = await createOrder(input);

    // Verify total amount calculation
    expect(result.total_amount).toEqual(35.50); // (2 * 10.00) + (1 * 15.50)

    // Verify order items were created
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();
    
    expect(orderItems).toHaveLength(2);
  });

  it('should throw error when insufficient stock', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Limited Stock Product',
        description: 'Product with limited stock',
        price: '25.00',
        stock_quantity: 3,
        category_id: category.id,
        image_url: null
      })
      .returning()
      .execute();
    const product = productResult[0];

    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: product.id,
        quantity: 5, // More than available stock
        price: '25.00'
      })
      .returning()
      .execute();
    const cartItem = cartItemResult[0];

    const input: CreateOrderInput = {
      cart_item_ids: [cartItem.id]
    };

    // Should throw error due to insufficient stock
    await expect(createOrder(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should throw error when cart items not found', async () => {
    const input: CreateOrderInput = {
      cart_item_ids: [999] // Non-existent cart item ID
    };

    await expect(createOrder(input)).rejects.toThrow(/no valid cart items found/i);
  });

  it('should throw error with empty cart item list', async () => {
    const input: CreateOrderInput = {
      cart_item_ids: []
    };

    // This should be caught by Zod validation, but test handler behavior
    await expect(createOrder(input)).rejects.toThrow();
  });
});