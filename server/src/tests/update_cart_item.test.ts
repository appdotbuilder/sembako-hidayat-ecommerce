
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cartItemsTable, categoriesTable, productsTable } from '../db/schema';
import { type UpdateCartItemInput } from '../schema';
import { updateCartItem } from '../handlers/update_cart_item';
import { eq } from 'drizzle-orm';

describe('updateCartItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update cart item quantity', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: category.id,
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();
    const product = productResult[0];

    // Create cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: product.id,
        quantity: 2,
        price: '19.99'
      })
      .returning()
      .execute();
    const cartItem = cartItemResult[0];

    const updateInput: UpdateCartItemInput = {
      id: cartItem.id,
      quantity: 5
    };

    const result = await updateCartItem(updateInput);

    // Basic field validation
    expect(result.id).toEqual(cartItem.id);
    expect(result.product_id).toEqual(product.id);
    expect(result.quantity).toEqual(5);
    expect(result.price).toEqual(19.99); // Should use current product price
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.price).toBe('number');
  });

  it('should save updated cart item to database', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: category.id,
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();
    const product = productResult[0];

    // Create cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: product.id,
        quantity: 2,
        price: '19.99'
      })
      .returning()
      .execute();
    const cartItem = cartItemResult[0];

    const updateInput: UpdateCartItemInput = {
      id: cartItem.id,
      quantity: 3
    };

    const result = await updateCartItem(updateInput);

    // Query database to verify update
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, result.id))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(3);
    expect(parseFloat(cartItems[0].price)).toEqual(19.99);
    expect(cartItems[0].product_id).toEqual(product.id);
  });

  it('should use current product price when updating', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: category.id,
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();
    const product = productResult[0];

    // Create cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: product.id,
        quantity: 2,
        price: '19.99'
      })
      .returning()
      .execute();
    const cartItem = cartItemResult[0];

    // Update product price
    await db.update(productsTable)
      .set({ price: '29.99' })
      .where(eq(productsTable.id, product.id))
      .execute();

    const updateInput: UpdateCartItemInput = {
      id: cartItem.id,
      quantity: 4
    };

    const result = await updateCartItem(updateInput);

    // Should use the updated product price
    expect(result.price).toEqual(29.99);
    expect(result.quantity).toEqual(4);
  });

  it('should throw error for non-existent cart item', async () => {
    const updateInput: UpdateCartItemInput = {
      id: 999,
      quantity: 3
    };

    await expect(updateCartItem(updateInput)).rejects.toThrow(/cart item.*not found/i);
  });

  it('should throw error when referenced product does not exist', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: category.id,
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();
    const product = productResult[0];

    // Create cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: product.id,
        quantity: 2,
        price: '19.99'
      })
      .returning()
      .execute();
    const cartItem = cartItemResult[0];

    // Delete the product to break the reference
    await db.delete(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    const updateInput: UpdateCartItemInput = {
      id: cartItem.id,
      quantity: 5
    };

    await expect(updateCartItem(updateInput)).rejects.toThrow(/product.*not found/i);
  });
});
