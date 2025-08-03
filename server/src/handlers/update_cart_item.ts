
import { db } from '../db';
import { cartItemsTable, productsTable } from '../db/schema';
import { type UpdateCartItemInput, type CartItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCartItem = async (input: UpdateCartItemInput): Promise<CartItem> => {
  try {
    // First, get the existing cart item to verify it exists and get product_id
    const existingCartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, input.id))
      .execute();

    if (existingCartItems.length === 0) {
      throw new Error(`Cart item with id ${input.id} not found`);
    }

    const existingCartItem = existingCartItems[0];

    // Get current product price
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, existingCartItem.product_id))
      .execute();

    if (products.length === 0) {
      throw new Error(`Product with id ${existingCartItem.product_id} not found`);
    }

    const currentPrice = parseFloat(products[0].price);

    // Update the cart item with new quantity and current price
    const result = await db.update(cartItemsTable)
      .set({
        quantity: input.quantity,
        price: currentPrice.toString() // Convert number to string for numeric column
      })
      .where(eq(cartItemsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedCartItem = result[0];
    return {
      ...updatedCartItem,
      price: parseFloat(updatedCartItem.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Cart item update failed:', error);
    throw error;
  }
};
