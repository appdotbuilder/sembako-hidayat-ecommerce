
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { MinusIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from 'lucide-react';
import type { CartItemWithProduct } from '../../../server/src/schema';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemWithProduct[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
}

export function ShoppingCart({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem 
}: ShoppingCartProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateItemTotal = (item: CartItemWithProduct) => {
    return item.quantity * item.price;
  };

  const calculateGrandTotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    // Simulate checkout process
    setTimeout(() => {
      alert('🎉 Terima kasih! Pesanan Anda akan segera diproses. Tim kami akan menghubungi Anda untuk konfirmasi.');
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-emerald-800 flex items-center">
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            Keranjang Belanja
          </SheetTitle>
          <SheetDescription className="text-emerald-600">
            🛒 {cartItems.length} item dalam keranjang
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-medium text-emerald-800 mb-2">
                Keranjang Kosong
              </h3>
              <p className="text-emerald-600 mb-4">
                Yuk, mulai belanja kebutuhan sembako Anda!
              </p>
              <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
                Mulai Belanja
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item: CartItemWithProduct) => (
                <div key={item.id} className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-emerald-800 mb-1">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-emerald-600">
                        {formatPrice(item.price)} per item
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-8 w-8 p-0 border-emerald-200 hover:bg-emerald-50"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          handleQuantityChange(item.id, newQuantity);
                        }}
                        className="w-16 h-8 text-center border-emerald-200 focus:border-emerald-400"
                        min="1"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0 border-emerald-200 hover:bg-emerald-50"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-emerald-800">
                        {formatPrice(calculateItemTotal(item))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="border-t border-emerald-100 pt-4">
            <div className="w-full space-y-4">
              <Separator />
              
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-emerald-800">Total:</span>
                <span className="text-emerald-800">
                  {formatPrice(calculateGrandTotal())}
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Memproses...
                  </span>
                ) : (
                  '💳 Checkout Sekarang'
                )}
              </Button>

              <p className="text-xs text-emerald-600 text-center">
                🚚 Gratis ongkir untuk pembelian di atas Rp 100.000
              </p>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
