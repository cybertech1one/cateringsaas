"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────────

export interface CartItem {
  dishId: string;
  name: string;
  price: number; // in cents
  quantity: number;
  variantId?: string;
  variantName?: string;
  notes?: string;
}

export type OrderType = "dine_in" | "pickup" | "delivery";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (dishId: string, variantId?: string) => void;
  updateQuantity: (dishId: string, quantity: number, variantId?: string) => void;
  updateNotes: (dishId: string, notes: string, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lastAddedKey: string | null;
  menuId: string;
  menuName: string;
  currency: string;
  whatsappNumber: string | null;
  enabledOrderTypes: string[];
  deliveryFee: number;
  minOrderAmount: number;
}

const CartContext = createContext<CartContextType | null>(null);

// ── Constants ────────────────────────────────────────────────

const STALE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function getStorageKey(menuSlug: string): string {
  return `feastqr-cart-${menuSlug}`;
}

function itemKey(dishId: string, variantId?: string): string {
  return variantId ? `${dishId}:${variantId}` : dishId;
}

// ── Persisted state shape ────────────────────────────────────

interface PersistedCart {
  items: CartItem[];
  tableNumber: string;
  customerName: string;
  timestamp: number;
}

function loadCart(menuSlug: string): PersistedCart | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getStorageKey(menuSlug));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedCart;

    // Stale detection: auto-clear after 2 hours
    if (Date.now() - parsed.timestamp > STALE_DURATION_MS) {
      localStorage.removeItem(getStorageKey(menuSlug));

      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveCart(menuSlug: string, cart: PersistedCart): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(menuSlug), JSON.stringify(cart));
  } catch {
    // Storage full or disabled - silently fail
  }
}

// ── Provider ─────────────────────────────────────────────────

export function CartProvider({
  children,
  menuSlug,
  menuId,
  menuName = "",
  currency = "",
  whatsappNumber = null,
  enabledOrderTypes = ["dine_in"],
  deliveryFee = 0,
  minOrderAmount = 0,
}: {
  children: ReactNode;
  menuSlug: string;
  menuId: string;
  menuName?: string;
  currency?: string;
  whatsappNumber?: string | null;
  enabledOrderTypes?: string[];
  deliveryFee?: number;
  minOrderAmount?: number;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderType, setOrderType] = useState<OrderType>(
    (enabledOrderTypes[0] as OrderType) ?? "dine_in",
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const persisted = loadCart(menuSlug);

    if (persisted) {
      setItems(persisted.items);
      setTableNumber(persisted.tableNumber);
      setCustomerName(persisted.customerName);
    }

    setInitialized(true);
  }, [menuSlug]);

  // Persist cart to localStorage when it changes
  useEffect(() => {
    if (!initialized) return;

    saveCart(menuSlug, {
      items,
      tableNumber,
      customerName,
      timestamp: Date.now(),
    });
  }, [items, tableNumber, customerName, menuSlug, initialized]);

  // ── Actions ──────────────────────────────────────────────

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      const key = itemKey(item.dishId, item.variantId);

      setLastAddedKey(key);

      // Clear the "just added" flag after animation completes
      setTimeout(() => setLastAddedKey(null), 600);

      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.dishId === item.dishId &&
            i.variantId === item.variantId,
        );

        if (existing) {
          return prev.map((i) =>
            i.dishId === item.dishId && i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          );
        }

        return [...prev, { ...item, quantity: 1 }];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (dishId: string, variantId?: string) => {
      setItems((prev) =>
        prev.filter(
          (i) => !(i.dishId === dishId && i.variantId === variantId),
        ),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (dishId: string, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeItem(dishId, variantId);

        return;
      }

      setItems((prev) =>
        prev.map((i) =>
          i.dishId === dishId && i.variantId === variantId
            ? { ...i, quantity: Math.min(quantity, 99) }
            : i,
        ),
      );
    },
    [removeItem],
  );

  const updateNotes = useCallback(
    (dishId: string, notes: string, variantId?: string) => {
      setItems((prev) =>
        prev.map((i) =>
          i.dishId === dishId && i.variantId === variantId
            ? { ...i, notes }
            : i,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setTableNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setPaymentMethod("cash");
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey(menuSlug));
    }
  }, [menuSlug]);

  // ── Computed values ──────────────────────────────────────

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateNotes,
      clearCart,
      totalItems,
      totalPrice,
      tableNumber,
      setTableNumber,
      customerName,
      setCustomerName,
      customerPhone,
      setCustomerPhone,
      deliveryAddress,
      setDeliveryAddress,
      orderType,
      setOrderType,
      paymentMethod,
      setPaymentMethod,
      isOpen,
      setIsOpen,
      lastAddedKey,
      menuId,
      menuName,
      currency,
      whatsappNumber,
      enabledOrderTypes,
      deliveryFee,
      minOrderAmount,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateNotes,
      clearCart,
      totalItems,
      totalPrice,
      tableNumber,
      setTableNumber,
      customerName,
      setCustomerName,
      customerPhone,
      setCustomerPhone,
      deliveryAddress,
      setDeliveryAddress,
      orderType,
      setOrderType,
      paymentMethod,
      setPaymentMethod,
      isOpen,
      setIsOpen,
      lastAddedKey,
      menuId,
      menuName,
      currency,
      whatsappNumber,
      enabledOrderTypes,
      deliveryFee,
      minOrderAmount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return ctx;
}

// Re-export the itemKey helper for use in other components
export { itemKey };
