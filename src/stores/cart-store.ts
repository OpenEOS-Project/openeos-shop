'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemOption {
  group: string;
  option: string;
  priceModifier: number;
  excluded?: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  options?: CartItemOption[];
  /** Stable signature so identical (productId + options) lines stack. */
  signature?: string;
}

interface CartState {
  eventId: string | null;
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'signature'> & { quantity?: number }) => void;
  decrement: (signature: string) => void;
  remove: (signature: string) => void;
  setEventId: (eventId: string | null) => void;
  clear: () => void;
}

export function makeSignature(productId: string, options?: CartItemOption[] | null): string {
  if (!options || options.length === 0) return productId;
  const sorted = [...options].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.option.localeCompare(b.option);
  });
  return `${productId}|${JSON.stringify(sorted)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      eventId: null,
      items: [],

      addItem: (item) =>
        set((state) => {
          const qty = item.quantity ?? 1;
          const signature = makeSignature(item.productId, item.options);
          const existing = state.items.find((i) => i.signature === signature);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.signature === signature ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                name: item.name,
                unitPrice: item.unitPrice,
                quantity: qty,
                options: item.options,
                signature,
              },
            ],
          };
        }),

      decrement: (signature) =>
        set((state) => {
          const next = state.items
            .map((i) => (i.signature === signature ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0);
          return { items: next };
        }),

      remove: (signature) =>
        set((state) => ({
          items: state.items.filter((i) => i.signature !== signature),
        })),

      setEventId: (eventId) =>
        set((state) => {
          if (state.eventId === eventId) return state;
          return { eventId, items: [] };
        }),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'openeos-shop-cart',
    },
  ),
);

export const cartCount = (items: CartItem[]) =>
  items.reduce((acc, i) => acc + i.quantity, 0);

export const lineUnitPrice = (item: CartItem): number => {
  const optionsTotal = (item.options ?? [])
    .filter((o) => !o.excluded && o.priceModifier > 0)
    .reduce((acc, o) => acc + o.priceModifier, 0);
  return item.unitPrice + optionsTotal;
};

export const cartTotal = (items: CartItem[]) =>
  items.reduce((acc, i) => acc + lineUnitPrice(i) * i.quantity, 0);
