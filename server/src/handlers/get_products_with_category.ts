
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type ProductWithCategory } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductsWithCategory = async (): Promise<ProductWithCategory[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .innerJoin(categoriesTable, eq(productsTable.category_id, categoriesTable.id))
      .execute();

    // Convert joined data structure to ProductWithCategory format
    return results.map(result => ({
      id: result.products.id,
      name: result.products.name,
      description: result.products.description,
      price: parseFloat(result.products.price), // Convert numeric to number
      stock_quantity: result.products.stock_quantity,
      category_id: result.products.category_id,
      image_url: result.products.image_url,
      created_at: result.products.created_at,
      category: {
        id: result.categories.id,
        name: result.categories.name,
        description: result.categories.description,
        created_at: result.categories.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to fetch products with categories:', error);
    throw error;
  }
};
