import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Product, Addon } from '../types/database';

export interface CartItem {
  id: string; // local unique id for cart management
  product: Product;
  quantity: number;
  addons: Addon[]; // multiple addons can be chosen per item
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, addons: Addon[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalQuantity: number;
  totalBoxes: number; // For points calculation (only RICE usually, or all items? Let's count all products that are 'RICE' as boxes)
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalAmount: 0,
  totalQuantity: 0,
  totalBoxes: 0,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity: number, addons: Addon[]) => {
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      product,
      quantity,
      addons
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) => prev.map((item) => 
      item.id === cartItemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setItems([]);

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => {
      const addonTotal = item.addons.reduce((sum, addon) => sum + Number(addon.price), 0);
      const itemTotal = (Number(item.product.base_price) + addonTotal) * item.quantity;
      return total + itemTotal;
    }, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const totalBoxes = useMemo(() => {
    // Requirements say "ซื้อ 10 กล่อง ฟรี 1 กล่อง"
    // Usually "boxes" refers to 'RICE' categories. 
    return items.reduce((total, item) => {
      if (item.product.category === 'RICE') {
        return total + item.quantity;
      }
      return total;
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalAmount, totalQuantity, totalBoxes }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
