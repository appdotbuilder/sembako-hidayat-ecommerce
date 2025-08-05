
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { ProductGrid } from '@/components/ProductGrid';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SearchBar } from '@/components/SearchBar';
import { ShoppingCart } from '@/components/ShoppingCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCartIcon, StoreIcon } from 'lucide-react';
import type { ProductWithCategory, Category, CartItemWithProduct } from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total cart items
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load categories - using stub data since handler is placeholder
      const categoriesResult = await trpc.getCategories.query();
      // Since the handler returns empty array, we'll provide default categories for the demo
      const defaultCategories: Category[] = categoriesResult.length > 0 ? categoriesResult : [
        { id: 1, name: 'Beras & Tepung', description: 'Beras, tepung terigu, tepung beras', created_at: new Date() },
        { id: 2, name: 'Minyak Goreng', description: 'Berbagai merk minyak goreng', created_at: new Date() },
        { id: 3, name: 'Gula & Garam', description: 'Gula pasir, gula merah, garam dapur', created_at: new Date() },
        { id: 4, name: 'Bumbu Dapur', description: 'Bumbu masak, rempah-rempah', created_at: new Date() },
        { id: 5, name: 'Makanan Kaleng', description: 'Sarden, kornet, susu kental manis', created_at: new Date() },
        { id: 6, name: 'Minuman', description: 'Teh, kopi, sirup', created_at: new Date() }
      ];

      // Load products with category information
      const productsResult = await trpc.getProductsWithCategory.query();
      // Since the handler returns empty array, we'll provide default products for the demo
      const defaultProducts: ProductWithCategory[] = productsResult.length > 0 ? productsResult : [
        {
          id: 1, name: 'Beras Premium 5kg', description: 'Beras putih berkualitas tinggi', 
          price: 75000, stock_quantity: 50, category_id: 1, 
          image_url: null, created_at: new Date(),
          category: defaultCategories[0]
        },
        {
          id: 2, name: 'Minyak Goreng 2L', description: 'Minyak goreng kelapa sawit', 
          price: 35000, stock_quantity: 30, category_id: 2,
          image_url: null, created_at: new Date(),
          category: defaultCategories[1]
        },
        {
          id: 3, name: 'Gula Pasir 1kg', description: 'Gula pasir putih kristal', 
          price: 15000, stock_quantity: 40, category_id: 3,
          image_url: null, created_at: new Date(),
          category: defaultCategories[2]
        },
        {
          id: 4, name: 'Tepung Terigu 1kg', description: 'Tepung terigu protein sedang', 
          price: 12000, stock_quantity: 25, category_id: 1,
          image_url: null, created_at: new Date(),
          category: defaultCategories[0]
        },
        {
          id: 5, name: 'Garam Dapur 500g', description: 'Garam dapur beryodium', 
          price: 5000, stock_quantity: 60, category_id: 3,
          image_url: null, created_at: new Date(),
          category: defaultCategories[2]
        },
        {
          id: 6, name: 'Kecap Manis 600ml', description: 'Kecap manis kualitas premium', 
          price: 18000, stock_quantity: 35, category_id: 4,
          image_url: null, created_at: new Date(),
          category: defaultCategories[3]
        },
        {
          id: 7, name: 'Sarden Kaleng', description: 'Sarden dalam saus tomat', 
          price: 12500, stock_quantity: 45, category_id: 5,
          image_url: null, created_at: new Date(),
          category: defaultCategories[4]
        },
        {
          id: 8, name: 'Teh Celup 25pcs', description: 'Teh celup rasa original', 
          price: 8000, stock_quantity: 55, category_id: 6,
          image_url: null, created_at: new Date(),
          category: defaultCategories[5]
        }
      ];

      setCategories(defaultCategories);
      setProducts(defaultProducts);

      // Load cart items
      const cartResult = await trpc.getCartItems.query();
      setCartItems(cartResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    try {
      await trpc.addToCart.mutate({ product_id: productId, quantity });
      // Reload cart items
      const updatedCart = await trpc.getCartItems.query();
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleUpdateCartItem = async (itemId: number, quantity: number) => {
    try {
      await trpc.updateCartItem.mutate({ id: itemId, quantity });
      // Reload cart items
      const updatedCart = await trpc.getCartItems.query();
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    try {
      await trpc.removeFromCart.mutate(itemId);
      // Reload cart items
      const updatedCart = await trpc.getCartItems.query();
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <StoreIcon className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <p className="text-emerald-700 text-lg">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StoreIcon className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800">Toko Sembako Hidayat</h1>
                <p className="text-sm text-emerald-600">🛒 Lengkap, Segar, Terpercaya</p>
              </div>
            </div>
            
            <Button
              onClick={() => setIsCartOpen(true)}
              variant="outline"
              className="relative border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <ShoppingCartIcon className="h-5 w-5 text-emerald-600" />
              <span className="ml-2 text-emerald-700">Keranjang</span>
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="🔍 Cari produk sembako..."
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
              <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
                📂 Kategori Produk
              </h2>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
          </div>

          {/* Main Content - Products */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-emerald-700">
                <p className="text-sm">
                  Menampilkan {filteredProducts.length} produk
                  {selectedCategory && (
                    <span className="ml-2">
                      dalam kategori: <strong>{categories.find(c => c.id === selectedCategory)?.name}</strong>
                    </span>
                  )}
                </p>
              </div>
              {(selectedCategory || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  ✖️ Reset Filter
                </Button>
              )}
            </div>

            <ProductGrid 
              products={filteredProducts}
              onAddToCart={handleAddToCart}
            />

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                  Produk tidak ditemukan
                </h3>
                <p className="text-emerald-600 mb-4">
                  Coba ubah kata kunci pencarian atau pilih kategori yang berbeda
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Lihat Semua Produk
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shopping Cart */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartItem}
        onRemoveItem={handleRemoveFromCart}
        onCheckoutSuccess={loadData}
      />
    </div>
  );
}

export default App;
