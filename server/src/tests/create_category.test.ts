
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Beras',
  description: 'Various types of rice products'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Beras');
    expect(result.description).toEqual('Various types of rice products');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Beras');
    expect(categories[0].description).toEqual('Various types of rice products');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create category with null description', async () => {
    const inputWithoutDescription: CreateCategoryInput = {
      name: 'Minyak Goreng'
    };

    const result = await createCategory(inputWithoutDescription);

    expect(result.name).toEqual('Minyak Goreng');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].description).toBeNull();
  });

  it('should create category with empty string description as null', async () => {
    const inputWithEmptyDescription: CreateCategoryInput = {
      name: 'Bumbu Dapur',
      description: ''
    };

    const result = await createCategory(inputWithEmptyDescription);

    expect(result.name).toEqual('Bumbu Dapur');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].description).toBeNull();
  });
});
