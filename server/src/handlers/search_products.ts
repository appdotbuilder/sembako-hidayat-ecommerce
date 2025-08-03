
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type SearchProductsInput, type ProductWithCategory } from '../schema';
import { eq, and, gte, lte, ilike, SQL } from 'drizzle-orm';

export const searchProducts = async (input: SearchProductsInput): Promise<ProductWithCategory[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Text search by product name
    if (input.query) {
      conditions.push(ilike(productsTable.name, `%${input.query}%`));
    }

    // Filter by category
    if (input.category_id !== undefined) {
      conditions.push(eq(productsTable.category_id, input.category_id));
    }

    // Filter by minimum price
    if (input.min_price !== undefined) {
      conditions.push(gte(productsTable.price, input.min_price.toString()));
    }

    // Filter by maximum price
    if (input.max_price !== undefined) {
      conditions.push(lte(productsTable.price, input.max_price.toString()));
    }

    // Build the query with conditional where clause
    const baseQuery = db.select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      stock_quantity: productsTable.stock_quantity,
      category_id: productsTable.category_id,
      image_url: productsTable.image_url,
      created_at: productsTable.created_at,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        description: categoriesTable.description,
        created_at: categoriesTable.created_at
      }
    })
    .from(productsTable)
    .innerJoin(categoriesTable, eq(productsTable.category_id, categoriesTable.id));

    // Apply where clause conditionally
    const query = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      price: parseFloat(result.price),
      stock_quantity: result.stock_quantity,
      category_id: result.category_id,
      image_url: result.image_url,
      created_at: result.created_at,
      category: {
        id: result.category.id,
        name: result.category.name,
        description: result.category.description,
        created_at: result.category.created_at
      }
    }));
  } catch (error) {
    console.error('Product search failed:', error);
    throw error;
  }
};
