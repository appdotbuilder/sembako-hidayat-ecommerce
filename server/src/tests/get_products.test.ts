
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('should return all products', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          description: 'First test product',
          price: '19.99',
          stock_quantity: 100,
          category_id: categoryId,
          image_url: 'https://example.com/product1.jpg'
        },
        {
          name: 'Product 2',
          description: 'Second test product',
          price: '29.99',
          stock_quantity: 50,
          category_id: categoryId,
          image_url: null
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    
    // Verify first product
    expect(result[0].name).toBe('Product 1');
    expect(result[0].description).toBe('First test product');
    expect(result[0].price).toBe(19.99);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].stock_quantity).toBe(100);
    expect(result[0].category_id).toBe(categoryId);
    expect(result[0].image_url).toBe('https://example.com/product1.jpg');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second product
    expect(result[1].name).toBe('Product 2');
    expect(result[1].description).toBe('Second test product');
    expect(result[1].price).toBe(29.99);
    expect(typeof result[1].price).toBe('number');
    expect(result[1].stock_quantity).toBe(50);
    expect(result[1].category_id).toBe(categoryId);
    expect(result[1].image_url).toBeNull();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle products with null descriptions', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create product with null description
    await db.insert(productsTable)
      .values({
        name: 'Product with null description',
        description: null,
        price: '15.50',
        stock_quantity: 25,
        category_id: categoryId,
        image_url: null
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Product with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].price).toBe(15.50);
    expect(typeof result[0].price).toBe('number');
  });
});
