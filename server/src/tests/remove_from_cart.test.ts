
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cartItemsTable, productsTable, categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type CreateProductInput, type AddToCartInput } from '../schema';
import { removeFromCart } from '../handlers/remove_from_cart';
import { eq } from 'drizzle-orm';

describe('removeFromCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove cart item and return deleted item', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Create test cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: productResult[0].id,
        quantity: 2,
        price: '19.99'
      })
      .returning()
      .execute();

    const cartItemId = cartItemResult[0].id;

    // Remove the cart item
    const result = await removeFromCart(cartItemId);

    // Verify returned data
    expect(result.id).toEqual(cartItemId);
    expect(result.product_id).toEqual(productResult[0].id);
    expect(result.quantity).toEqual(2);
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should remove cart item from database', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Create test cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        product_id: productResult[0].id,
        quantity: 2,
        price: '19.99'
      })
      .returning()
      .execute();

    const cartItemId = cartItemResult[0].id;

    // Remove the cart item
    await removeFromCart(cartItemId);

    // Verify cart item is deleted from database
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId))
      .execute();

    expect(cartItems).toHaveLength(0);
  });

  it('should throw error when cart item does not exist', async () => {
    const nonExistentId = 999;

    await expect(removeFromCart(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should handle multiple cart items correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Create multiple cart items
    const cartItem1Result = await db.insert(cartItemsTable)
      .values({
        product_id: productResult[0].id,
        quantity: 1,
        price: '19.99'
      })
      .returning()
      .execute();

    const cartItem2Result = await db.insert(cartItemsTable)
      .values({
        product_id: productResult[0].id,
        quantity: 3,
        price: '19.99'
      })
      .returning()
      .execute();

    // Remove first cart item
    await removeFromCart(cartItem1Result[0].id);

    // Verify only first item is removed
    const remainingItems = await db.select()
      .from(cartItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].id).toEqual(cartItem2Result[0].id);
    expect(remainingItems[0].quantity).toEqual(3);
  });
});
