
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { getProductsWithCategory } from '../handlers/get_products_with_category';

describe('getProductsWithCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProductsWithCategory();
    expect(result).toEqual([]);
  });

  it('should return products with category information', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices and gadgets'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Smartphone',
        description: 'Latest smartphone model',
        price: '599.99',
        stock_quantity: 50,
        category_id: category.id,
        image_url: 'https://example.com/phone.jpg'
      })
      .returning()
      .execute();

    const result = await getProductsWithCategory();

    expect(result).toHaveLength(1);
    
    const product = result[0];
    expect(product.id).toBe(productResult[0].id);
    expect(product.name).toBe('Smartphone');
    expect(product.description).toBe('Latest smartphone model');
    expect(product.price).toBe(599.99);
    expect(typeof product.price).toBe('number');
    expect(product.stock_quantity).toBe(50);
    expect(product.category_id).toBe(category.id);
    expect(product.image_url).toBe('https://example.com/phone.jpg');
    expect(product.created_at).toBeInstanceOf(Date);

    // Verify category information
    expect(product.category).toBeDefined();
    expect(product.category.id).toBe(category.id);
    expect(product.category.name).toBe('Electronics');
    expect(product.category.description).toBe('Electronic devices and gadgets');
    expect(product.category.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple products with their categories', async () => {
    // Create test categories
    const electronicsResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();

    const clothingResult = await db.insert(categoriesTable)
      .values({
        name: 'Clothing',
        description: 'Apparel and accessories'
      })
      .returning()
      .execute();

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '1299.99',
          stock_quantity: 25,
          category_id: electronicsResult[0].id,
          image_url: null
        },
        {
          name: 'T-Shirt',
          description: 'Cotton t-shirt',
          price: '19.99',
          stock_quantity: 100,
          category_id: clothingResult[0].id,
          image_url: 'https://example.com/tshirt.jpg'
        }
      ])
      .execute();

    const result = await getProductsWithCategory();

    expect(result).toHaveLength(2);

    // Find products by name for consistent testing
    const laptop = result.find(p => p.name === 'Laptop');
    const tshirt = result.find(p => p.name === 'T-Shirt');

    expect(laptop).toBeDefined();
    expect(laptop!.category.name).toBe('Electronics');
    expect(laptop!.price).toBe(1299.99);
    expect(laptop!.image_url).toBeNull();

    expect(tshirt).toBeDefined();
    expect(tshirt!.category.name).toBe('Clothing');
    expect(tshirt!.price).toBe(19.99);
    expect(tshirt!.image_url).toBe('https://example.com/tshirt.jpg');
  });

  it('should handle products with null descriptions and image URLs', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: null
      })
      .returning()
      .execute();

    // Create product with null fields
    await db.insert(productsTable)
      .values({
        name: 'Mystery Novel',
        description: null,
        price: '12.99',
        stock_quantity: 30,
        category_id: categoryResult[0].id,
        image_url: null
      })
      .execute();

    const result = await getProductsWithCategory();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].image_url).toBeNull();
    expect(result[0].category.description).toBeNull();
  });
});
