
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCategoryInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
  searchProductsInputSchema
} from './schema';

// Import handlers
import { getCategories } from './handlers/get_categories';
import { createCategory } from './handlers/create_category';
import { getProducts } from './handlers/get_products';
import { getProductsWithCategory } from './handlers/get_products_with_category';
import { searchProducts } from './handlers/search_products';
import { getProductsByCategory } from './handlers/get_products_by_category';
import { createProduct } from './handlers/create_product';
import { updateProduct } from './handlers/update_product';
import { getCartItems } from './handlers/get_cart_items';
import { addToCart } from './handlers/add_to_cart';
import { updateCartItem } from './handlers/update_cart_item';
import { removeFromCart } from './handlers/remove_from_cart';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category routes
  getCategories: publicProcedure
    .query(() => getCategories()),
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  // Product routes
  getProducts: publicProcedure
    .query(() => getProducts()),
  getProductsWithCategory: publicProcedure
    .query(() => getProductsWithCategory()),
  searchProducts: publicProcedure
    .input(searchProductsInputSchema)
    .query(({ input }) => searchProducts(input)),
  getProductsByCategory: publicProcedure
    .input(z.number())
    .query(({ input }) => getProductsByCategory(input)),
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  // Cart routes
  getCartItems: publicProcedure
    .query(() => getCartItems()),
  addToCart: publicProcedure
    .input(addToCartInputSchema)
    .mutation(({ input }) => addToCart(input)),
  updateCartItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItem(input)),
  removeFromCart: publicProcedure
    .input(z.number())
    .mutation(({ input }) => removeFromCart(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
