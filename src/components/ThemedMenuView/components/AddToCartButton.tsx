"use client";

import { useCallback, useMemo } from "react";
import { useCart, itemKey } from "./CartProvider";

// ── SVG Icons ────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Keyframe Styles ──────────────────────────────────────────

export function AddToCartStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes cartBtnPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.cart-btn-pulse {
  animation: cartBtnPulse 0.3s ease-out;
}
`,
      }}
    />
  );
}

// ── Component ────────────────────────────────────────────────

export function AddToCartButton({
  dishId,
  dishName,
  price,
  variantId,
  variantName,
  disabled,
}: {
  dishId: string;
  dishName: string;
  price: number;
  variantId?: string;
  variantName?: string;
  disabled?: boolean;
}) {
  const { items, addItem, removeItem, updateQuantity, lastAddedKey } = useCart();

  const key = itemKey(dishId, variantId);
  const isJustAdded = lastAddedKey === key;

  const cartItem = useMemo(
    () =>
      items.find(
        (i) => i.dishId === dishId && i.variantId === variantId,
      ),
    [items, dishId, variantId],
  );

  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addItem({
        dishId,
        name: dishName,
        price,
        variantId,
        variantName,
      });
    },
    [addItem, dishId, dishName, price, variantId, variantName],
  );

  const handleDecrement = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (quantity <= 1) {
        removeItem(dishId, variantId);
      } else {
        updateQuantity(dishId, quantity - 1, variantId);
      }
    },
    [quantity, removeItem, updateQuantity, dishId, variantId],
  );

  const handleIncrement = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addItem({
        dishId,
        name: dishName,
        price,
        variantId,
        variantName,
      });
    },
    [addItem, dishId, dishName, price, variantId, variantName],
  );

  // ── Initial "+" button (no items in cart) ──────────────

  if (disabled) {
    return null;
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        aria-label={`Add ${dishName} to order`}
        className={isJustAdded ? "cart-btn-pulse" : ""}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "var(--menu-primary)",
          color: "var(--menu-surface)",
          cursor: "pointer",
          flexShrink: 0,
          transition: "transform 0.15s ease, opacity 0.15s ease",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        <PlusIcon />
      </button>
    );
  }

  // ── Quantity stepper (items in cart) ────────────────────

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0",
        borderRadius: "9999px",
        border: "1.5px solid var(--menu-primary)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={handleDecrement}
        aria-label={`Decrease quantity of ${dishName}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          border: "none",
          backgroundColor: "transparent",
          color: "var(--menu-primary)",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        <MinusIcon />
      </button>

      <span
        className={isJustAdded ? "cart-btn-pulse" : ""}
        style={{
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-sm)",
          fontWeight: 600,
          color: "var(--menu-primary)",
          minWidth: "24px",
          textAlign: "center",
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        aria-label={`Increase quantity of ${dishName}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          border: "none",
          backgroundColor: "var(--menu-primary)",
          color: "var(--menu-surface)",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
