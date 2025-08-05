import { db } from '../db';
import { cartItemsTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { type CreateOrderInput, type Order } from '../schema';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    // Fetch cart items with product details
    const cartItems = await db.select({
      cart_id: cartItemsTable.id,
      product_id: cartItemsTable.product_id,
      quantity: cartItemsTable.quantity,
      cart_price: cartItemsTable.price,
      product_name: productsTable.name,
      current_price: productsTable.price,
      stock_quantity: productsTable.stock_quantity
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
    .where(inArray(cartItemsTable.id, input.cart_item_ids))
    .execute();

    if (cartItems.length === 0) {
      throw new Error('No valid cart items found');
    }

    if (cartItems.length !== input.cart_item_ids.length) {
      throw new Error('Some cart items not found');
    }

    // Perform stock check
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        throw new Error(`Insufficient stock for ${item.product_name}. Available: ${item.stock_quantity}, Requested: ${item.quantity}`);
      }
    }

    // Calculate total amount using current product prices
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.current_price));
    }, 0);

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Create the order
      const orderResult = await tx.insert(ordersTable)
        .values({
          user_id: null, // No user authentication yet
          total_amount: totalAmount.toString(),
          status: 'completed'
        })
        .returning()
        .execute();

      const order = orderResult[0];

      // Create order items
      const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.current_price // Use current product price
      }));

      await tx.insert(orderItemsTable)
        .values(orderItemsData)
        .execute();

      // Update product stock quantities
      for (const item of cartItems) {
        await tx.update(productsTable)
          .set({
            stock_quantity: item.stock_quantity - item.quantity
          })
          .where(eq(productsTable.id, item.product_id))
          .execute();
      }

      // Remove processed cart items
      await tx.delete(cartItemsTable)
        .where(inArray(cartItemsTable.id, input.cart_item_ids))
        .execute();

      return order;
    });

    // Convert numeric fields back to numbers before returning
    return {
      ...result,
      total_amount: parseFloat(result.total_amount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};