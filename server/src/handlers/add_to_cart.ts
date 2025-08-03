
import { db } from '../db';
import { cartItemsTable, productsTable } from '../db/schema';
import { type AddToCartInput, type CartItem } from '../schema';
import { eq } from 'drizzle-orm';

export const addToCart = async (input: AddToCartInput): Promise<CartItem> => {
  try {
    // First, verify the product exists and get its current price
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    const productPrice = parseFloat(product[0].price);

    // Check if item already exists in cart
    const existingCartItem = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, input.product_id))
      .execute();

    let result;

    if (existingCartItem.length > 0) {
      // Update existing cart item quantity
      const newQuantity = existingCartItem[0].quantity + input.quantity;
      
      result = await db.update(cartItemsTable)
        .set({ 
          quantity: newQuantity,
          price: productPrice.toString() // Update price to current product price
        })
        .where(eq(cartItemsTable.id, existingCartItem[0].id))
        .returning()
        .execute();
    } else {
      // Create new cart item
      result = await db.insert(cartItemsTable)
        .values({
          product_id: input.product_id,
          quantity: input.quantity,
          price: productPrice.toString()
        })
        .returning()
        .execute();
    }

    // Convert numeric price back to number
    const cartItem = result[0];
    return {
      ...cartItem,
      price: parseFloat(cartItem.price)
    };
  } catch (error) {
    console.error('Add to cart failed:', error);
    throw error;
  }
};
