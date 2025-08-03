
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type SearchProductsInput } from '../schema';
import { searchProducts } from '../handlers/search_products';

describe('searchProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all products when no filters are provided', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '999.99',
          stock_quantity: 10,
          category_id: category.id
        },
        {
          name: 'Mouse',
          description: 'Wireless mouse',
          price: '29.99',
          stock_quantity: 50,
          category_id: category.id
        }
      ])
      .execute();

    const input: SearchProductsInput = {};
    const results = await searchProducts(input);

    expect(results).toHaveLength(2);
    results.forEach(product => {
      expect(product.category).toBeDefined();
      expect(product.category.name).toEqual('Electronics');
      expect(typeof product.price).toBe('number');
    });
  });

  it('should filter products by text query', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Gaming Laptop',
          description: 'High-end gaming laptop',
          price: '1299.99',
          stock_quantity: 5,
          category_id: category.id
        },
        {
          name: 'Wireless Mouse',
          description: 'Ergonomic mouse',
          price: '39.99',
          stock_quantity: 25,
          category_id: category.id
        }
      ])
      .execute();

    const input: SearchProductsInput = {
      query: 'laptop'
    };
    const results = await searchProducts(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Gaming Laptop');
    expect(results[0].price).toEqual(1299.99);
    expect(results[0].category.name).toEqual('Electronics');
  });

  it('should filter products by category', async () => {
    // Create test categories
    const electronicsResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();
    const electronicsCategory = electronicsResult[0];

    const booksResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: 'Literature and textbooks'
      })
      .returning()
      .execute();
    const booksCategory = booksResult[0];

    // Create products in different categories
    await db.insert(productsTable)
      .values([
        {
          name: 'Smartphone',
          description: 'Latest smartphone',
          price: '699.99',
          stock_quantity: 15,
          category_id: electronicsCategory.id
        },
        {
          name: 'Novel',
          description: 'Bestselling novel',
          price: '19.99',
          stock_quantity: 100,
          category_id: booksCategory.id
        }
      ])
      .execute();

    const input: SearchProductsInput = {
      category_id: booksCategory.id
    };
    const results = await searchProducts(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Novel');
    expect(results[0].category.name).toEqual('Books');
  });

  it('should filter products by price range', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create products with different prices
    await db.insert(productsTable)
      .values([
        {
          name: 'Budget Phone',
          description: 'Affordable smartphone',
          price: '199.99',
          stock_quantity: 20,
          category_id: category.id
        },
        {
          name: 'Premium Phone',
          description: 'High-end smartphone',
          price: '899.99',
          stock_quantity: 8,
          category_id: category.id
        },
        {
          name: 'Ultra Phone',
          description: 'Top-tier smartphone',
          price: '1299.99',
          stock_quantity: 3,
          category_id: category.id
        }
      ])
      .execute();

    const input: SearchProductsInput = {
      min_price: 300,
      max_price: 1000
    };
    const results = await searchProducts(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Premium Phone');
    expect(results[0].price).toEqual(899.99);
    expect(results[0].price).toBeGreaterThanOrEqual(300);
    expect(results[0].price).toBeLessThanOrEqual(1000);
  });

  it('should combine multiple filters', async () => {
    // Create test categories
    const electronicsResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();
    const electronicsCategory = electronicsResult[0];

    const booksResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: 'Literature and textbooks'
      })
      .returning()
      .execute();
    const booksCategory = booksResult[0];

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Gaming Laptop',
          description: 'High-performance laptop',
          price: '1199.99',
          stock_quantity: 7,
          category_id: electronicsCategory.id
        },
        {
          name: 'Office Laptop',
          description: 'Business laptop',
          price: '599.99',
          stock_quantity: 12,
          category_id: electronicsCategory.id
        },
        {
          name: 'Laptop Manual',
          description: 'How to use laptops',
          price: '24.99',
          stock_quantity: 50,
          category_id: booksCategory.id
        }
      ])
      .execute();

    const input: SearchProductsInput = {
      query: 'laptop',
      category_id: electronicsCategory.id,
      min_price: 500,
      max_price: 800
    };
    const results = await searchProducts(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Office Laptop');
    expect(results[0].price).toEqual(599.99);
    expect(results[0].category.name).toEqual('Electronics');
  });

  it('should return empty array when no products match filters', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create a product that won't match our search
    await db.insert(productsTable)
      .values({
        name: 'Keyboard',
        description: 'Mechanical keyboard',
        price: '79.99',
        stock_quantity: 30,
        category_id: category.id
      })
      .execute();

    const input: SearchProductsInput = {
      query: 'nonexistent product'
    };
    const results = await searchProducts(input);

    expect(results).toHaveLength(0);
  });
});
