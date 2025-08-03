
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { getProductsByCategory } from '../handlers/get_products_by_category';

describe('getProductsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products with category information', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test product
    await db.insert(productsTable)
      .values({
        name: 'Laptop',
        description: 'Gaming laptop',
        price: '999.99',
        stock_quantity: 5,
        category_id: category.id,
        image_url: 'https://example.com/laptop.jpg'
      })
      .execute();

    const results = await getProductsByCategory(category.id);

    expect(results).toHaveLength(1);
    
    const product = results[0];
    expect(product.name).toEqual('Laptop');
    expect(product.description).toEqual('Gaming laptop');
    expect(product.price).toEqual(999.99);
    expect(typeof product.price).toEqual('number');
    expect(product.stock_quantity).toEqual(5);
    expect(product.category_id).toEqual(category.id);
    expect(product.image_url).toEqual('https://example.com/laptop.jpg');
    expect(product.id).toBeDefined();
    expect(product.created_at).toBeInstanceOf(Date);

    // Verify category information is included
    expect(product.category.id).toEqual(category.id);
    expect(product.category.name).toEqual('Electronics');
    expect(product.category.description).toEqual('Electronic devices');
    expect(product.category.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple products for same category', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Food',
        description: 'Food items'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create multiple products
    await db.insert(productsTable)
      .values([
        {
          name: 'Rice',
          description: 'Basmati rice',
          price: '5.99',
          stock_quantity: 100,
          category_id: category.id
        },
        {
          name: 'Pasta',
          description: 'Italian pasta',
          price: '3.49',
          stock_quantity: 50,
          category_id: category.id
        }
      ])
      .execute();

    const results = await getProductsByCategory(category.id);

    expect(results).toHaveLength(2);
    
    // Verify all products belong to the same category
    results.forEach(product => {
      expect(product.category_id).toEqual(category.id);
      expect(product.category.name).toEqual('Food');
      expect(typeof product.price).toEqual('number');
    });

    // Verify product names
    const productNames = results.map(p => p.name).sort();
    expect(productNames).toEqual(['Pasta', 'Rice']);
  });

  it('should return empty array for non-existent category', async () => {
    const results = await getProductsByCategory(999);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array for category with no products', async () => {
    // Create category without products
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Empty Category',
        description: 'Category with no products'
      })
      .returning()
      .execute();

    const results = await getProductsByCategory(categoryResult[0].id);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should not return products from other categories', async () => {
    // Create two categories
    const categoriesResult = await db.insert(categoriesTable)
      .values([
        {
          name: 'Electronics',
          description: 'Electronic devices'
        },
        {
          name: 'Books',
          description: 'Reading materials'
        }
      ])
      .returning()
      .execute();

    const electronicsCategory = categoriesResult[0];
    const booksCategory = categoriesResult[1];

    // Create products in different categories
    await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '999.99',
          stock_quantity: 5,
          category_id: electronicsCategory.id
        },
        {
          name: 'Novel',
          description: 'Fiction book',
          price: '12.99',
          stock_quantity: 20,
          category_id: booksCategory.id
        }
      ])
      .execute();

    const electronicsResults = await getProductsByCategory(electronicsCategory.id);

    expect(electronicsResults).toHaveLength(1);
    expect(electronicsResults[0].name).toEqual('Laptop');
    expect(electronicsResults[0].category.name).toEqual('Electronics');
  });
});
