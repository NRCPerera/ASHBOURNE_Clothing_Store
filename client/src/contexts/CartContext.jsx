import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'ashbourne_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to persist cart to localStorage', err);
    }
  }, [cart]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  /**
   * Add a product variant to the cart.
   * @param {Object} product - Product document
   * @param {Object} variant - Selected variant { sku, size, color, stock, priceOverride }
   * @param {number} quantity - Quantity to add
   */
  const addToCart = useCallback((product, variant, quantity = 1) => {
    if (!product || !variant) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.variantSku === variant.sku
      );

      const price =
        variant.priceOverride != null ? variant.priceOverride : product.basePrice;
      const image =
        product.images?.[0]?.url ||
        (Array.isArray(product.images) && typeof product.images[0] === 'string'
          ? product.images[0]
          : '');

      if (existingIndex > -1) {
        // Increment quantity up to available stock
        const updated = [...prevCart];
        const existing = updated[existingIndex];
        const newQty = Math.min(existing.quantity + quantity, variant.stock);
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          stock: variant.stock, // update latest stock in case it changed
          price,
        };
        return updated;
      }

      // Add new item
      const newItem = {
        productId: product._id,
        productSlug: product.slug,
        name: product.name,
        image,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color,
        price,
        stock: variant.stock,
        quantity: Math.min(quantity, variant.stock),
      };

      return [...prevCart, newItem];
    });
  }, []);

  /**
   * Update quantity of a cart item.
   */
  const updateQuantity = useCallback((variantSku, quantity) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.variantSku !== variantSku);
      }
      return prevCart.map((item) => {
        if (item.variantSku === variantSku) {
          const clamped = Math.min(Math.max(1, quantity), item.stock);
          return { ...item, quantity: clamped };
        }
        return item;
      });
    });
  }, []);

  /**
   * Remove item from cart.
   */
  const removeFromCart = useCallback((variantSku) => {
    setCart((prevCart) => prevCart.filter((item) => item.variantSku !== variantSku));
  }, []);

  /**
   * Clear entire cart.
   */
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Total item quantity count
  const itemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Subtotal in LKR
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      cart,
      itemCount,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
