"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { api } from "~/trpc/react";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { useCart } from "./CartProvider";
import { formatPrice, getCurrencySymbol } from "../utils";
import { OrderConfirmation } from "./OrderConfirmation";
import { WhatsAppOrderButton } from "./WhatsAppOrderButton";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

function getNotesLabel(
  showNotes: boolean,
  notes: string | undefined,
  t: (key: string) => string,
): string {
  if (showNotes) return t("ordering.notes");

  if (notes) return `${t("ordering.notes")}: ${notes.slice(0, 30)}...`;

  return `+ ${t("ordering.notes")}`;
}

// ── SVG Icons ────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MinusSmallIcon() {
  return (
    <svg
      width="14"
      height="14"
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

function PlusSmallIcon() {
  return (
    <svg
      width="14"
      height="14"
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

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function EmptyCartIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ opacity: 0.4 }}
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

// ── Keyframe Styles ──────────────────────────────────────────

export function CartDrawerStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes cartDrawerSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes cartDrawerSlideDown {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}
@keyframes cartDrawerSlideLeft {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes cartDrawerSlideRight {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}
@keyframes cartOverlayFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cartOverlayFadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}
/* Desktop: right-side panel (DoorDash / Uber Eats pattern) */
@media (min-width: 768px) {
  .cart-drawer-panel {
    top: 0 !important;
    bottom: 0 !important;
    left: auto !important;
    right: 0 !important;
    max-height: 100vh !important;
    width: 420px !important;
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }
  .cart-drawer-panel.cart-drawer-enter {
    animation: cartDrawerSlideLeft 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards !important;
  }
  .cart-drawer-panel.cart-drawer-exit {
    animation: cartDrawerSlideRight 0.28s ease forwards !important;
  }
}
`,
      }}
    />
  );
}

// ── Shared input style ──────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--menu-border)",
  backgroundColor: "var(--menu-surface)",
  color: "var(--menu-text)",
  fontFamily: "var(--menu-body-font)",
  fontSize: "var(--menu-font-base)",
  outline: "none",
  boxSizing: "border-box",
};

const errorInputStyle: React.CSSProperties = {
  ...inputStyle,
  border: "2px solid var(--menu-accent)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--menu-font-sm)",
  fontWeight: 600,
  marginBottom: "4px",
  color: "var(--menu-text)",
};

const errorTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--menu-accent)",
  margin: "4px 0 0",
};

// ── Component ────────────────────────────────────────────────

export function CartDrawer() {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const {
    items,
    removeItem: _removeItem,
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
    menuId,
    menuName,
    currency,
    whatsappNumber,
    enabledOrderTypes,
    deliveryFee,
    minOrderAmount,
  } = useCart();

  const [isClosing, setIsClosing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderNumber: number;
    orderId: string;
  } | null>(null);
  const [tableError, setTableError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const _drawerRef = useRef<HTMLDivElement>(null);
  const { containerRef: cartRef, handleKeyDown: handleCartKeyDown } = useFocusTrap(isOpen);

  const createOrder = api.orders.createOrder.useMutation({
    onSuccess: (data) => {
      setOrderResult({
        orderNumber: data.orderNumber,
        orderId: data.id,
      });
      setShowConfirmation(true);
      clearCart();
    },
  });

  // Close handler with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setShowConfirmation(false);
      setOrderResult(null);
    }, 280);
  }, [setIsOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSubmitOrder = useCallback(() => {
    let hasError = false;

    // Dine-in requires table number
    if (orderType === "dine_in" && !tableNumber.trim()) {
      setTableError(true);
      hasError = true;
    } else {
      setTableError(false);
    }

    // Pickup and delivery require name and phone
    if (orderType !== "dine_in" && !customerName.trim()) {
      setNameError(true);
      hasError = true;
    } else {
      setNameError(false);
    }

    if (orderType !== "dine_in" && !customerPhone.trim()) {
      setPhoneError(true);
      hasError = true;
    } else {
      setPhoneError(false);
    }

    // Delivery requires address
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      setAddressError(true);
      hasError = true;
    } else {
      setAddressError(false);
    }

    if (hasError) return;

    createOrder.mutate({
      menuId,
      tableNumber: tableNumber.trim() || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      orderType,
      paymentMethod: orderType === "delivery" ? paymentMethod : "cash",
      items: items.map((item) => ({
        dishId: item.dishId,
        dishVariantId: item.variantId,
        dishName: item.variantName
          ? `${item.name} (${item.variantName})`
          : item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes || undefined,
      })),
    });
  }, [
    tableNumber,
    customerName,
    customerPhone,
    deliveryAddress,
    orderType,
    paymentMethod,
    items,
    menuId,
    createOrder,
  ]);

  const toggleNotes = useCallback((key: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }, []);

  if (!isOpen) return null;

  // Calculate total with delivery fee
  const showDeliveryFee = orderType === "delivery" && deliveryFee > 0;
  const grandTotal = totalPrice + (showDeliveryFee ? deliveryFee : 0);

  // Minimum order amount validation (compare items-only total, matching server logic)
  const isBelowMinimum = minOrderAmount > 0 && totalPrice < minOrderAmount;
  const remainingAmount = minOrderAmount - totalPrice;

  // ── Order Confirmation View ─────────────────────────────

  if (showConfirmation && orderResult) {
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={handleClose}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.5)",
            animation: isClosing
              ? "cartOverlayFadeOut 0.28s ease forwards"
              : "cartOverlayFadeIn 0.2s ease forwards",
          }}
        />
        {/* Drawer Panel */}
        <div
          ref={cartRef}
          onKeyDown={handleCartKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={t("ordering.orderConfirmation")}
          className={`cart-drawer-panel ${isClosing ? "cart-drawer-exit" : "cart-drawer-enter"}`}
          style={{
            position: "fixed",
            zIndex: 51,
            backgroundColor: "var(--menu-background)",
            color: "var(--menu-text)",
            fontFamily: "var(--menu-body-font)",
            display: "flex",
            flexDirection: "column",
            // Mobile: bottom sheet
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "90vh",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            animation: isClosing
              ? "cartDrawerSlideDown 0.28s ease forwards"
              : "cartDrawerSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          }}
        >
          <OrderConfirmation
            orderNumber={orderResult.orderNumber}
            orderId={orderResult.orderId}
            onOrderMore={handleClose}
            onClose={handleClose}
          />
        </div>
      </>
    );
  }

  // ── Main Cart View ──────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.5)",
          animation: isClosing
            ? "cartOverlayFadeOut 0.28s ease forwards"
            : "cartOverlayFadeIn 0.2s ease forwards",
        }}
      />

      {/* Drawer Panel */}
      <div
        ref={cartRef}
        onKeyDown={handleCartKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={t("ordering.cart")}
        className={`cart-drawer-panel ${isClosing ? "cart-drawer-exit" : "cart-drawer-enter"}`}
        style={{
          position: "fixed",
          zIndex: 51,
          backgroundColor: "var(--menu-background)",
          color: "var(--menu-text)",
          fontFamily: "var(--menu-body-font)",
          display: "flex",
          flexDirection: "column",
          // Mobile: bottom sheet
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "90vh",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          animation: isClosing
            ? "cartDrawerSlideDown 0.28s ease forwards"
            : "cartDrawerSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        }}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 12px",
            borderBottom: "1px solid var(--menu-border)",
            flexShrink: 0,
          }}
        >
          {/* Drag handle (mobile affordance) */}
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "var(--menu-border)",
            }}
          />

          <div>
            <h2
              style={{
                fontFamily: "var(--menu-heading-font)",
                fontSize: "var(--menu-font-xl)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {t("ordering.cart")}
            </h2>
            {totalItems > 0 && (
              <p
                style={{
                  fontSize: "var(--menu-font-sm)",
                  color: "var(--menu-muted)",
                  margin: "2px 0 0",
                }}
              >
                {t("ordering.items", { count: totalItems })}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label={t("cart.ariaCloseCart")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid var(--menu-border)",
              backgroundColor: "transparent",
              color: "var(--menu-text)",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Screen reader announcement for cart updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {totalItems > 0
            ? t("cart.ariaCartSummary", {
                count: totalItems,
                total: `${formatPrice(grandTotal)} ${getCurrencySymbol(currency)}`,
              })
            : t("ordering.emptyCart")}
        </div>

        {/* ── Cart Content ────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.length === 0 ? (
            /* Empty state */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <EmptyCartIcon />
              <h3
                style={{
                  fontFamily: "var(--menu-heading-font)",
                  fontSize: "var(--menu-font-lg)",
                  fontWeight: 600,
                  margin: "16px 0 8px",
                  color: "var(--menu-text)",
                }}
              >
                {t("ordering.emptyCart")}
              </h3>
              <p
                style={{
                  fontSize: "var(--menu-font-sm)",
                  color: "var(--menu-muted)",
                  margin: 0,
                  maxWidth: "240px",
                  lineHeight: 1.5,
                }}
              >
                {t("ordering.emptyCartDescription")}
              </p>
            </div>
          ) : (
            <>
              {/* Order Type Selector */}
              <OrderTypeSelector
                enabledTypes={enabledOrderTypes}
                selected={orderType}
                onSelect={(type) =>
                  setOrderType(type as "dine_in" | "pickup" | "delivery")
                }
              />

              {/* Item list */}
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {items.map((item) => {
                  const key = item.variantId
                    ? `${item.dishId}:${item.variantId}`
                    : item.dishId;
                  const showNotes = expandedNotes.has(key);

                  return (
                    <li
                      key={key}
                      style={{
                        padding: "12px 0",
                        borderBottom: "1px solid var(--menu-border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        {/* Left: info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontWeight: 600,
                              fontSize: "var(--menu-font-base)",
                              margin: 0,
                              lineHeight: 1.3,
                            }}
                          >
                            {item.name}
                          </p>
                          {item.variantName && (
                            <p
                              style={{
                                fontSize: "var(--menu-font-sm)",
                                color: "var(--menu-muted)",
                                margin: "2px 0 0",
                              }}
                            >
                              {item.variantName}
                            </p>
                          )}
                          <p
                            style={{
                              fontSize: "var(--menu-font-sm)",
                              color: "var(--menu-primary)",
                              fontWeight: 500,
                              margin: "4px 0 0",
                            }}
                          >
                            {formatPrice(item.price)}{" "}
                            <span style={{ color: "var(--menu-muted)", fontWeight: 400 }}>
                              {getCurrencySymbol(currency)}
                            </span>
                          </p>
                        </div>

                        {/* Right: quantity + subtotal */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "8px",
                            flexShrink: 0,
                          }}
                        >
                          {/* Quantity stepper */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0",
                              borderRadius: "8px",
                              border: "1px solid var(--menu-border)",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.dishId,
                                  item.quantity - 1,
                                  item.variantId,
                                )
                              }
                              aria-label={item.quantity <= 1 ? t("cart.ariaRemoveItem", { name: item.name }) : t("cart.ariaDecreaseQuantity", { name: item.name })}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                border: "none",
                                backgroundColor: "transparent",
                                color: "var(--menu-text)",
                                cursor: "pointer",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                              }}
                            >
                              {item.quantity <= 1 ? (
                                <TrashIcon />
                              ) : (
                                <MinusSmallIcon />
                              )}
                            </button>

                            <span
                              aria-live="polite"
                              style={{
                                fontSize: "var(--menu-font-sm)",
                                fontWeight: 600,
                                minWidth: "28px",
                                textAlign: "center",
                                userSelect: "none",
                              }}
                            >
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.dishId,
                                  item.quantity + 1,
                                  item.variantId,
                                )
                              }
                              aria-label={t("cart.ariaIncreaseQuantity", { name: item.name })}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                border: "none",
                                backgroundColor: "transparent",
                                color: "var(--menu-text)",
                                cursor: "pointer",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                              }}
                            >
                              <PlusSmallIcon />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <span
                            style={{
                              fontSize: "var(--menu-font-sm)",
                              fontWeight: 600,
                              color: "var(--menu-text)",
                            }}
                          >
                            {formatPrice(item.price * item.quantity)}{" "}
                            <span style={{ color: "var(--menu-muted)", fontWeight: 400, fontSize: "11px" }}>
                              {getCurrencySymbol(currency)}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Notes toggle */}
                      <button
                        type="button"
                        onClick={() => toggleNotes(key)}
                        aria-expanded={showNotes}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          color: "var(--menu-muted)",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 0 0",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        {getNotesLabel(showNotes, item.notes, t)}
                      </button>

                      {/* Notes input */}
                      {showNotes && (
                        <textarea
                          value={item.notes ?? ""}
                          onChange={(e) =>
                            updateNotes(
                              item.dishId,
                              e.target.value,
                              item.variantId,
                            )
                          }
                          aria-label={t("ordering.notesPlaceholder")}
                          placeholder={t("ordering.notesPlaceholder")}
                          maxLength={500}
                          rows={2}
                          style={{
                            width: "100%",
                            marginTop: "8px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid var(--menu-border)",
                            backgroundColor: "var(--menu-surface)",
                            color: "var(--menu-text)",
                            fontFamily: "var(--menu-body-font)",
                            fontSize: "var(--menu-font-sm)",
                            resize: "none",
                            outline: "none",
                          }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Clear cart link */}
              {items.length > 1 && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{
                      fontSize: "var(--menu-font-sm)",
                      color: "var(--menu-muted)",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {t("ordering.clearCart")}
                  </button>
                </div>
              )}

              {/* ── Customer Info ────────────────────────── */}
              <div
                style={{
                  padding: "16px 0 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Table number - shown for dine-in */}
                {orderType === "dine_in" && (
                  <div>
                    <label htmlFor="cart-table-number" style={labelStyle}>
                      {t("ordering.tableNumber")} *
                    </label>
                    <input
                      id="cart-table-number"
                      type="text"
                      inputMode="numeric"
                      value={tableNumber}
                      onChange={(e) => {
                        setTableNumber(e.target.value);
                        if (e.target.value.trim()) setTableError(false);
                      }}
                      placeholder={t("ordering.tableNumberPlaceholder")}
                      maxLength={20}
                      aria-required="true"
                      aria-invalid={tableError}
                      aria-describedby={tableError ? "cart-table-number-error" : undefined}
                      style={tableError ? errorInputStyle : inputStyle}
                    />
                    {tableError && (
                      <p id="cart-table-number-error" style={errorTextStyle}>
                        {t("ordering.tableNumberRequired")}
                      </p>
                    )}
                  </div>
                )}

                {/* Customer name - required for pickup/delivery, optional for dine-in */}
                <div>
                  <label htmlFor="cart-customer-name" style={labelStyle}>
                    {orderType === "dine_in"
                      ? t("ordering.customerName")
                      : `${t("ordering.customerNameLabel")} *`}
                  </label>
                  <input
                    id="cart-customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    placeholder={t("ordering.customerNamePlaceholder")}
                    maxLength={100}
                    aria-required={orderType !== "dine_in"}
                    aria-invalid={nameError}
                    aria-describedby={nameError ? "cart-customer-name-error" : undefined}
                    style={nameError ? errorInputStyle : inputStyle}
                  />
                  {nameError && (
                    <p id="cart-customer-name-error" style={errorTextStyle}>
                      {t("cart.nameRequired")}
                    </p>
                  )}
                </div>

                {/* Customer phone - required for pickup/delivery */}
                {orderType !== "dine_in" && (
                  <div>
                    <label htmlFor="cart-customer-phone" style={labelStyle}>
                      {t("cart.phone")} *
                    </label>
                    <input
                      id="cart-customer-phone"
                      type="tel"
                      inputMode="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (e.target.value.trim()) setPhoneError(false);
                      }}
                      placeholder={t("cart.phonePlaceholder")}
                      maxLength={20}
                      aria-required="true"
                      aria-invalid={phoneError}
                      aria-describedby={phoneError ? "cart-customer-phone-error" : undefined}
                      style={phoneError ? errorInputStyle : inputStyle}
                    />
                    {phoneError && (
                      <p id="cart-customer-phone-error" style={errorTextStyle}>
                        {t("cart.phoneRequired")}
                      </p>
                    )}
                  </div>
                )}

                {/* Delivery address - required for delivery */}
                {orderType === "delivery" && (
                  <div>
                    <label htmlFor="cart-delivery-address" style={labelStyle}>
                      {t("cart.deliveryAddress")} *
                    </label>
                    <textarea
                      id="cart-delivery-address"
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        if (e.target.value.trim()) setAddressError(false);
                      }}
                      placeholder={t("cart.deliveryAddressPlaceholder")}
                      maxLength={500}
                      rows={2}
                      aria-required="true"
                      aria-invalid={addressError}
                      aria-describedby={addressError ? "cart-delivery-address-error" : undefined}
                      style={{
                        ...(addressError ? errorInputStyle : inputStyle),
                        resize: "none",
                      }}
                    />
                    {addressError && (
                      <p id="cart-delivery-address-error" style={errorTextStyle}>
                        {t("cart.addressRequired")}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Method Selector - shown for delivery orders */}
                {orderType === "delivery" && (
                  <div style={{ paddingTop: "4px" }}>
                    <PaymentMethodSelector
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />

                    {/* COD helper message */}
                    {paymentMethod === "cash" && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--menu-muted)",
                          margin: "8px 0 0",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          backgroundColor: "var(--menu-surface)",
                          border: "1px solid var(--menu-border)",
                          lineHeight: 1.4,
                        }}
                      >
                        {t("payment.codMessage")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer (Totals + Submit) ────────────────── */}
        {items.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--menu-border)",
              flexShrink: 0,
            }}
          >
            {/* Totals */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginBottom: "16px",
              }}
            >
              {/* Subtotal row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--menu-font-sm)",
                    color: "var(--menu-muted)",
                  }}
                >
                  {t("ordering.subtotal")}
                </span>
                <span
                  style={{
                    fontSize: "var(--menu-font-sm)",
                    color: "var(--menu-text)",
                  }}
                >
                  {formatPrice(totalPrice)}{" "}
                  <span style={{ color: "var(--menu-muted)", fontSize: "11px" }}>
                    {getCurrencySymbol(currency)}
                  </span>
                </span>
              </div>

              {/* Delivery fee row */}
              {showDeliveryFee && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--menu-font-sm)",
                      color: "var(--menu-muted)",
                    }}
                  >
                    {t("cart.deliveryFee")}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--menu-font-sm)",
                      color: "var(--menu-text)",
                    }}
                  >
                    {formatPrice(deliveryFee)}{" "}
                    <span style={{ color: "var(--menu-muted)", fontSize: "11px" }}>
                      {getCurrencySymbol(currency)}
                    </span>
                  </span>
                </div>
              )}

              {/* Total row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  paddingTop: showDeliveryFee ? "8px" : "0",
                  borderTop: showDeliveryFee
                    ? "1px solid var(--menu-border)"
                    : "none",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--menu-font-base)",
                    fontWeight: 600,
                    color: "var(--menu-text)",
                  }}
                >
                  {t("ordering.total")}
                </span>
                <span
                  style={{
                    fontSize: "var(--menu-font-xl)",
                    fontWeight: 700,
                    color: "var(--menu-primary)",
                  }}
                >
                  {formatPrice(grandTotal)}{" "}
                  <span
                    style={{
                      fontSize: "var(--menu-font-sm)",
                      fontWeight: 400,
                      color: "var(--menu-muted)",
                    }}
                  >
                    {getCurrencySymbol(currency)}
                  </span>
                </span>
              </div>
            </div>

            {/* Minimum order warning */}
            {isBelowMinimum && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(var(--menu-accent-rgb, 239, 68, 68), 0.08)",
                  border: "1px solid rgba(var(--menu-accent-rgb, 239, 68, 68), 0.2)",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--menu-font-sm)",
                    fontWeight: 600,
                    color: "var(--menu-accent)",
                  }}
                >
                  {t("ordering.minimumOrder", {
                    amount: `${formatPrice(minOrderAmount)} ${getCurrencySymbol(currency)}`,
                  })}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--menu-muted)",
                  }}
                >
                  {t("ordering.addMore", {
                    amount: `${formatPrice(remainingAmount)} ${getCurrencySymbol(currency)}`,
                  })}
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={createOrder.isLoading || items.length === 0 || isBelowMinimum}
              style={{
                width: "100%",
                padding: "14px 24px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: "var(--menu-primary)",
                color: "var(--menu-surface)",
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-base)",
                fontWeight: 700,
                cursor: createOrder.isLoading || isBelowMinimum ? "not-allowed" : "pointer",
                opacity: createOrder.isLoading || isBelowMinimum ? 0.5 : 1,
                transition: "opacity 0.15s ease",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                minHeight: "48px",
              }}
            >
              {createOrder.isLoading
                ? t("ordering.sending")
                : t("ordering.sendOrder")}
            </button>

            {/* Error message + Retry */}
            {createOrder.isError && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  margin: "8px 0 0",
                }}
              >
                <p
                  style={{
                    fontSize: "var(--menu-font-sm)",
                    color: "var(--menu-accent)",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  {createOrder.error?.message || t("toastCommon.errorDescription")}
                </p>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: "1px solid var(--menu-primary)",
                    backgroundColor: "transparent",
                    color: "var(--menu-primary)",
                    fontFamily: "var(--menu-body-font)",
                    fontSize: "var(--menu-font-sm)",
                    fontWeight: 600,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}
                >
                  {t("ordering.retry")}
                </button>
              </div>
            )}

            {/* WhatsApp order option */}
            {whatsappNumber && (
              <div style={{ marginTop: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: "0 0 12px",
                  }}
                >
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--menu-border)" }} />
                  <span
                    style={{
                      fontSize: "var(--menu-font-sm)",
                      color: "var(--menu-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("ordering.orVia")}
                  </span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--menu-border)" }} />
                </div>
                <WhatsAppOrderButton
                  menuName={menuName}
                  whatsappNumber={whatsappNumber}
                  cartItems={items}
                  currency={currency}
                  tableNumber={tableNumber || undefined}
                  customerName={customerName || undefined}
                />
              </div>
            )}

            {/* Safe area padding for iOS */}
            <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        )}
      </div>
    </>
  );
}
