
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test category
  const createTestCategory = async () => {
    const result = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a product with all fields', async () => {
    const category = await createTestCategory();
    
    const testInput: CreateProductInput = {
      name: 'Test Product',
      description: 'A product for testing',
      price: 19.99,
      stock_quantity: 100,
      category_id: category.id,
      image_url: 'https://example.com/image.jpg'
    };

    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toBe('number');
    expect(result.stock_quantity).toEqual(100);
    expect(result.category_id).toEqual(category.id);
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a product with minimal fields', async () => {
    const category = await createTestCategory();
    
    const testInput: CreateProductInput = {
      name: 'Minimal Product',
      price: 9.99,
      stock_quantity: 50,
      category_id: category.id
    };

    const result = await createProduct(testInput);

    expect(result.name).toEqual('Minimal Product');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(9.99);
    expect(typeof result.price).toBe('number');
    expect(result.stock_quantity).toEqual(50);
    expect(result.category_id).toEqual(category.id);
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const category = await createTestCategory();
    
    const testInput: CreateProductInput = {
      name: 'Database Test Product',
      description: 'Testing database persistence',
      price: 29.99,
      stock_quantity: 75,
      category_id: category.id,
      image_url: 'https://example.com/test.jpg'
    };

    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Database Test Product');
    expect(savedProduct.description).toEqual('Testing database persistence');
    expect(parseFloat(savedProduct.price)).toEqual(29.99);
    expect(savedProduct.stock_quantity).toEqual(75);
    expect(savedProduct.category_id).toEqual(category.id);
    expect(savedProduct.image_url).toEqual('https://example.com/test.jpg');
    expect(savedProduct.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal prices correctly', async () => {
    const category = await createTestCategory();
    
    const testInput: CreateProductInput = {
      name: 'Decimal Price Product',
      price: 15.45, // Use 2 decimal places to match PostgreSQL numeric(10,2)
      stock_quantity: 25,
      category_id: category.id
    };

    const result = await createProduct(testInput);

    expect(result.price).toEqual(15.45);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(products[0].price)).toEqual(15.45);
  });

  it('should create product with zero stock', async () => {
    const category = await createTestCategory();
    
    const testInput: CreateProductInput = {
      name: 'Out of Stock Product',
      price: 19.99,
      stock_quantity: 0,
      category_id: category.id
    };

    const result = await createProduct(testInput);

    expect(result.name).toEqual('Out of Stock Product');
    expect(result.stock_quantity).toEqual(0);
    expect(result.category_id).toEqual(category.id);
    expect(result.id).toBeDefined();
  });
});
