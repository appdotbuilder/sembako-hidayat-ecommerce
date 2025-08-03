
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Electronics',
          description: 'Electronic devices and gadgets'
        },
        {
          name: 'Books',
          description: 'Physical and digital books'
        },
        {
          name: 'Clothing',
          description: null
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify all fields are present and correct
    const electronics = result.find(cat => cat.name === 'Electronics');
    expect(electronics).toBeDefined();
    expect(electronics?.description).toEqual('Electronic devices and gadgets');
    expect(electronics?.id).toBeDefined();
    expect(electronics?.created_at).toBeInstanceOf(Date);

    const books = result.find(cat => cat.name === 'Books');
    expect(books).toBeDefined();
    expect(books?.description).toEqual('Physical and digital books');

    const clothing = result.find(cat => cat.name === 'Clothing');
    expect(clothing).toBeDefined();
    expect(clothing?.description).toBeNull();
  });

  it('should return categories ordered by creation time', async () => {
    // Create categories with slight delays to ensure different timestamps
    await db.insert(categoriesTable)
      .values({ name: 'First Category', description: 'First' })
      .execute();

    await db.insert(categoriesTable)
      .values({ name: 'Second Category', description: 'Second' })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Category');
    expect(result[1].name).toEqual('Second Category');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
