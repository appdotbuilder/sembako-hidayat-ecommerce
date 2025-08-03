
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { getCartItems } from '../handlers/get_cart_items';

describe('getCartItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cart items exist', async () => {
    const result = await getCartItems();
    expect(result).toEqual([]);
  });

  it('should return cart items with product details', async () => {
    // Create a category first
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create a product
    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '29.99',
        stock_quantity: 50,
        category_id: category[0].id,
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();

    // Add item to cart
    const cartItem = await db.insert(cartItemsTable)
      .values({
        product_id: product[0].id,
        quantity: 2,
        price: '29.99'
      })
      .returning()
      .execute();

    const result = await getCartItems();

    expect(result).toHaveLength(1);
    
    const item = result[0];
    expect(item.id).toBe(cartItem[0].id);
    expect(item.product_id).toBe(product[0].id);
    expect(item.quantity).toBe(2);
    expect(item.price).toBe(29.99);
    expect(typeof item.price).toBe('number');
    expect(item.created_at).toBeInstanceOf(Date);

    // Verify product details are included
    expect(item.product.id).toBe(product[0].id);
    expect(item.product.name).toBe('Test Product');
    expect(item.product.description).toBe('A product for testing');
    expect(item.product.price).toBe(29.99);
    expect(typeof item.product.price).toBe('number');
    expect(item.product.stock_quantity).toBe(50);
    expect(item.product.category_id).toBe(category[0].id);
    expect(item.product.image_url).toBe('https://example.com/image.jpg');
    expect(item.product.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple cart items with their products', async () => {
    // Create a category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();

    // Create multiple products
    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '999.99',
          stock_quantity: 10,
          category_id: category[0].id,
          image_url: 'https://example.com/laptop.jpg'
        },
        {
          name: 'Mouse',
          description: 'Wireless mouse',
          price: '49.99',
          stock_quantity: 25,
          category_id: category[0].id,
          image_url: 'https://example.com/mouse.jpg'
        }
      ])
      .returning()
      .execute();

    // Add both products to cart
    await db.insert(cartItemsTable)
      .values([
        {
          product_id: products[0].id,
          quantity: 1,
          price: '999.99'
        },
        {
          product_id: products[1].id,
          quantity: 3,
          price: '49.99'
        }
      ])
      .execute();

    const result = await getCartItems();

    expect(result).toHaveLength(2);

    // Verify both items are returned with correct product details
    const laptopItem = result.find(item => item.product.name === 'Laptop');
    const mouseItem = result.find(item => item.product.name === 'Mouse');

    expect(laptopItem).toBeDefined();
    expect(laptopItem!.quantity).toBe(1);
    expect(laptopItem!.price).toBe(999.99);
    expect(laptopItem!.product.description).toBe('Gaming laptop');

    expect(mouseItem).toBeDefined();
    expect(mouseItem!.quantity).toBe(3);
    expect(mouseItem!.price).toBe(49.99);
    expect(mouseItem!.product.description).toBe('Wireless mouse');
  });

  it('should handle products with null descriptions and image_urls', async () => {
    // Create a category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Basic Category',
        description: null
      })
      .returning()
      .execute();

    // Create a product with null optional fields
    const product = await db.insert(productsTable)
      .values({
        name: 'Basic Product',
        description: null,
        price: '15.50',
        stock_quantity: 100,
        category_id: category[0].id,
        image_url: null
      })
      .returning()
      .execute();

    // Add item to cart
    await db.insert(cartItemsTable)
      .values({
        product_id: product[0].id,
        quantity: 5,
        price: '15.50'
      })
      .execute();

    const result = await getCartItems();

    expect(result).toHaveLength(1);
    
    const item = result[0];
    expect(item.product.name).toBe('Basic Product');
    expect(item.product.description).toBeNull();
    expect(item.product.image_url).toBeNull();
    expect(item.product.price).toBe(15.50);
    expect(item.quantity).toBe(5);
  });
});
