
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput, type CreateCategoryInput, type CreateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let productId: number;

  beforeEach(async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Original Product',
        description: 'Original description',
        price: '29.99',
        stock_quantity: 50,
        category_id: categoryId,
        image_url: 'https://example.com/original.jpg'
      })
      .returning()
      .execute();
    productId = productResult[0].id;
  });

  it('should update all product fields', async () => {
    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Updated Product',
      description: 'Updated description',
      price: 39.99,
      stock_quantity: 75,
      category_id: categoryId,
      image_url: 'https://example.com/updated.jpg'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(productId);
    expect(result.name).toEqual('Updated Product');
    expect(result.description).toEqual('Updated description');
    expect(result.price).toEqual(39.99);
    expect(typeof result.price).toEqual('number');
    expect(result.stock_quantity).toEqual(75);
    expect(result.category_id).toEqual(categoryId);
    expect(result.image_url).toEqual('https://example.com/updated.jpg');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Partially Updated Product',
      price: 49.99
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Partially Updated Product');
    expect(result.price).toEqual(49.99);
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.stock_quantity).toEqual(50); // Should remain unchanged
    expect(result.image_url).toEqual('https://example.com/original.jpg'); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Database Updated Product',
      price: 59.99
    };

    await updateProduct(updateInput);

    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated Product');
    expect(parseFloat(products[0].price)).toEqual(59.99);
    expect(products[0].description).toEqual('Original description'); // Unchanged
  });

  it('should handle null values correctly', async () => {
    const updateInput: UpdateProductInput = {
      id: productId,
      description: null,
      image_url: null
    };

    const result = await updateProduct(updateInput);

    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.name).toEqual('Original Product'); // Should remain unchanged
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'Non-existent Product'
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/product with id 99999 not found/i);
  });

  it('should update stock quantity to zero', async () => {
    const updateInput: UpdateProductInput = {
      id: productId,
      stock_quantity: 0
    };

    const result = await updateProduct(updateInput);

    expect(result.stock_quantity).toEqual(0);
    expect(result.name).toEqual('Original Product'); // Should remain unchanged
  });
});
