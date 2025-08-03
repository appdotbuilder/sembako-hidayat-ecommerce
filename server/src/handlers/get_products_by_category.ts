
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type ProductWithCategory } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductsByCategory = async (categoryId: number): Promise<ProductWithCategory[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .innerJoin(categoriesTable, eq(productsTable.category_id, categoriesTable.id))
      .where(eq(productsTable.category_id, categoryId))
      .execute();

    // Handle joined data structure - results are nested objects
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
    console.error('Get products by category failed:', error);
    throw error;
  }
};
