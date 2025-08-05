
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCartIcon, PackageIcon } from 'lucide-react';
import type { ProductWithCategory } from '../../../server/src/schema';

interface ProductGridProps {
  products: ProductWithCategory[];
  onAddToCart: (productId: number, quantity: number) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStockStatus = (stock: number) => {
    if (stock > 20) return { text: 'Stok Banyak', color: 'bg-green-100 text-green-800 border-green-200' };
    if (stock > 5) return { text: 'Stok Terbatas', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (stock > 0) return { text: 'Stok Sedikit', color: 'bg-red-100 text-red-800 border-red-200' };
    return { text: 'Habis', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product: ProductWithCategory) => {
        const stockStatus = getStockStatus(product.stock_quantity);
        const isOutOfStock = product.stock_quantity === 0;

        return (
          <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-emerald-100 hover:border-emerald-200 bg-white">
            <img
              src={product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0NDQ0NDQyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-xl mb-4"
            />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-emerald-800 group-hover:text-emerald-700 transition-colors">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-emerald-600 mt-1">
                    {product.description || 'Produk berkualitas tinggi'}
                  </CardDescription>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <PackageIcon className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  📁 {product.category.name}
                </Badge>
                <Badge className={`text-xs border ${stockStatus.color}`}>
                  📦 {stockStatus.text}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="py-3">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-emerald-800">
                  {formatPrice(product.price)}
                </div>
                <div className="text-sm text-emerald-600">
                  Stok: {product.stock_quantity}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-3">
              <Button
                onClick={() => onAddToCart(product.id, 1)}
                disabled={isOutOfStock}
                className={`w-full ${
                  isOutOfStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
                } transition-all duration-200`}
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                {isOutOfStock ? '❌ Stok Habis' : '🛒 Tambah ke Keranjang'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
