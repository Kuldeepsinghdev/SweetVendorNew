'use client';

/**
 * Storefront cart context (client-only convenience state).
 *
 * MIGRATION NOTE (Task 7): the cart holds only the customer's SELECTION —
 * sweet id, variant, quantity, and display-only price hints for rendering. It
 * persists to localStorage so a refresh keeps the cart, which is acceptable
 * because NONE of this is trusted for money: the server recomputes every price
 * at checkout (previewBookingAction / createBookingAction). No auth/identity is
 * ever stored here.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface CartLine {
  sweetId: string;
  variantLabel: string;
  quantity: number;
  // Display-only hints (server re-prices authoritatively at checkout):
  sweetNameHi: string;
  sweetNameEn: string;
  variantKg: number;
  unitPriceHint: number;
  imageUrl?: string;
  /** The sale centre this line was added from — checkout requires one centre. */
  saleCenterId: string;
}

interface CartContextValue {
  lines: CartLine[];
  saleCenterId: string | null;
  totalItems: number;
  displayTotalHint: number;
  addLine: (line: CartLine) => void;
  setQty: (sweetId: string, variantLabel: string, qty: number) => void;
  removeLine: (sweetId: string, variantLabel: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'sahakar_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration to avoid clobbering with []).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore quota/availability errors
    }
  }, [lines, hydrated]);

  const addLine = useCallback((line: CartLine) => {
    setLines((prev) => {
      // A cart is scoped to ONE sale centre (checkout prices against one centre).
      // If the new line is from a different centre, replace the cart.
      const differentCentre = prev.length > 0 && prev[0].saleCenterId !== line.saleCenterId;
      const base = differentCentre ? [] : prev;
      const idx = base.findIndex(
        (l) => l.sweetId === line.sweetId && l.variantLabel === line.variantLabel
      );
      if (idx >= 0) {
        const next = [...base];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + line.quantity };
        return next;
      }
      return [...base, line];
    });
  }, []);

  const setQty = useCallback((sweetId: string, variantLabel: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.sweetId === sweetId && l.variantLabel === variantLabel
            ? { ...l, quantity: Math.max(0, qty) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const removeLine = useCallback((sweetId: string, variantLabel: string) => {
    setLines((prev) =>
      prev.filter((l) => !(l.sweetId === sweetId && l.variantLabel === variantLabel))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
    const displayTotalHint = lines.reduce((s, l) => s + l.unitPriceHint * l.quantity, 0);
    return {
      lines,
      saleCenterId: lines[0]?.saleCenterId ?? null,
      totalItems,
      displayTotalHint,
      addLine,
      setQty,
      removeLine,
      clear,
    };
  }, [lines, addLine, setQty, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
