
import { db } from '../db';
import { cartItemsTable, productsTable } from '../db/schema';
import { type CartItemWithProduct } from '../schema';
import { eq } from 'drizzle-orm';

export const getCartItems = async (): Promise<CartItemWithProduct[]> => {
  try {
    // Join cart items with their corresponding products
    const results = await db.select()
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
      .execute();

    // Transform the joined results to match CartItemWithProduct schema
    return results.map(result => ({
      id: result.cart_items.id,
      product_id: result.cart_items.product_id,
      quantity: result.cart_items.quantity,
      price: parseFloat(result.cart_items.price), // Convert numeric to number
      created_at: result.cart_items.created_at,
      product: {
        id: result.products.id,
        name: result.products.name,
        description: result.products.description,
        price: parseFloat(result.products.price), // Convert numeric to number
        stock_quantity: result.products.stock_quantity,
        category_id: result.products.category_id,
        image_url: result.products.image_url,
        created_at: result.products.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to get cart items:', error);
    throw error;
  }
};
