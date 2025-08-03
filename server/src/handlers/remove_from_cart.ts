
import { db } from '../db';
import { cartItemsTable } from '../db/schema';
import { type CartItem } from '../schema';
import { eq } from 'drizzle-orm';

export const removeFromCart = async (cartItemId: number): Promise<CartItem> => {
  try {
    // Delete the cart item and return the deleted record
    const result = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Cart item with id ${cartItemId} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const cartItem = result[0];
    return {
      ...cartItem,
      price: parseFloat(cartItem.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Cart item removal failed:', error);
    throw error;
  }
};
