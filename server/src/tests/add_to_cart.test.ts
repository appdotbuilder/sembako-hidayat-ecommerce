
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { type AddToCartInput } from '../schema';
import { addToCart } from '../handlers/add_to_cart';
import { eq } from 'drizzle-orm';

describe('addToCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let productId: number;

  beforeEach(async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '29.99',
        stock_quantity: 50,
        category_id: categoryId,
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();
    productId = productResult[0].id;
  });

  it('should add new item to cart', async () => {
    const input: AddToCartInput = {
      product_id: productId,
      quantity: 2
    };

    const result = await addToCart(input);

    expect(result.product_id).toEqual(productId);
    expect(result.quantity).toEqual(2);
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save cart item to database', async () => {
    const input: AddToCartInput = {
      product_id: productId,
      quantity: 3
    };

    const result = await addToCart(input);

    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, result.id))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].product_id).toEqual(productId);
    expect(cartItems[0].quantity).toEqual(3);
    expect(parseFloat(cartItems[0].price)).toEqual(29.99);
  });

  it('should update quantity if item already exists in cart', async () => {
    // Add item first time
    const firstInput: AddToCartInput = {
      product_id: productId,
      quantity: 2
    };
    await addToCart(firstInput);

    // Add same item again
    const secondInput: AddToCartInput = {
      product_id: productId,
      quantity: 3
    };
    const result = await addToCart(secondInput);

    expect(result.quantity).toEqual(5); // 2 + 3
    expect(result.price).toEqual(29.99);

    // Verify only one cart item exists
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, productId))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(5);
  });

  it('should throw error for non-existent product', async () => {
    const input: AddToCartInput = {
      product_id: 99999,
      quantity: 1
    };

    expect(addToCart(input)).rejects.toThrow(/product with id 99999 not found/i);
  });

  it('should use current product price when adding to cart', async () => {
    const input: AddToCartInput = {
      product_id: productId,
      quantity: 1
    };

    const result = await addToCart(input);

    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number');
  });

  it('should update price when adding existing item to cart', async () => {
    // Add item first time
    const firstInput: AddToCartInput = {
      product_id: productId,
      quantity: 1
    };
    await addToCart(firstInput);

    // Update product price
    await db.update(productsTable)
      .set({ price: '39.99' })
      .where(eq(productsTable.id, productId))
      .execute();

    // Add same item again - should update to new price
    const secondInput: AddToCartInput = {
      product_id: productId,
      quantity: 1
    };
    const result = await addToCart(secondInput);

    expect(result.price).toEqual(39.99); // Updated price
    expect(result.quantity).toEqual(2);
  });
});
