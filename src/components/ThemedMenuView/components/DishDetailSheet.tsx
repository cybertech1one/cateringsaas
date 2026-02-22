"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

import { shimmerToBase64 } from "~/utils/shimmer";
import { getDishVariantsTranslated } from "~/utils/categoriesUtils";
import { useFocusTrap } from "~/hooks/useFocusTrap";

import { type ParsedDish } from "../types";
import { formatPrice, getCurrencySymbol } from "../utils";
import { useCart } from "./CartProvider";

// ── SVG Icons ─────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
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

function MinusIcon() {
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
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

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

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Keyframe Styles ──────────────────────────────────────────

export function DishDetailSheetStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes dishSheetSlideUp {
  from {
    transform: translateY(100%);
    opacity: 0.5;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes dishSheetSlideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0.5;
  }
}
@keyframes dishSheetOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes dishSheetOverlayOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}
@keyframes dishSheetScaleIn {
  from {
    transform: translate(-50%, -50%) scale(0.92);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
@keyframes dishSheetScaleOut {
  from {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(0.92);
    opacity: 0;
  }
}
@keyframes dishSheetAddedPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`,
      }}
    />
  );
}

// ── Types ─────────────────────────────────────────────────────

interface DishDetailSheetProps {
  dish: ParsedDish | null;
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  languageId?: string;
}

// ── Component ─────────────────────────────────────────────────

export function DishDetailSheet({
  dish,
  isOpen,
  onClose,
  currency,
  languageId = "en",
}: DishDetailSheetProps) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const { containerRef: trapRef, handleKeyDown: handleTrapKeyDown } = useFocusTrap(!!dish && isOpen);
  const mergedSheetRef = useCallback((node: HTMLDivElement | null) => {
    (sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [trapRef]);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number>(0);

  // ── Translated variants ─────────────────────────────────

  const translatedVariants = useMemo(() => {
    if (!dish) return [];

    return getDishVariantsTranslated({
      dishVariants: dish.dishVariants,
      languageId,
    });
  }, [dish, languageId]);

  // ── Reset state when dish changes ───────────────────────

  useEffect(() => {
    if (dish && isOpen) {
      setQuantity(1);
      setNotes("");
      setJustAdded(false);
      // Auto-select first variant if dish has variants
      if (translatedVariants.length > 0) {
        setSelectedVariantId(translatedVariants[0]?.id ?? null);
      } else {
        setSelectedVariantId(null);
      }
    }
  }, [dish?.id, isOpen, translatedVariants.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Active price computation ────────────────────────────

  const activePrice = useMemo(() => {
    if (!dish) return 0;

    if (selectedVariantId && translatedVariants.length > 0) {
      const variant = translatedVariants.find((v) => v.id === selectedVariantId);

      if (variant?.price != null && variant.price > 0) {
        return variant.price;
      }
    }

    return dish.price;
  }, [dish, selectedVariantId, translatedVariants]);

  const activeVariantName = useMemo(() => {
    if (!selectedVariantId || translatedVariants.length === 0) return undefined;

    const variant = translatedVariants.find((v) => v.id === selectedVariantId);

    return variant?.name || undefined;
  }, [selectedVariantId, translatedVariants]);

  // ── Close handler with animation ────────────────────────

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  }, [onClose]);

  // ── Escape key ──────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // ── Prevent body scroll ─────────────────────────────────

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

  // ── Touch swipe-to-close ────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];

    if (touch) {
      touchStartY.current = touch.clientY;
      touchCurrentY.current = touch.clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];

    if (touch && touchStartY.current !== null) {
      touchCurrentY.current = touch.clientY;
      const deltaY = touch.clientY - touchStartY.current;

      // Only allow downward drag
      if (deltaY > 0 && sheetRef.current) {
        const scrollTop = sheetRef.current.scrollTop;

        // Only drag if at top of scroll
        if (scrollTop <= 0) {
          e.preventDefault();
          sheetRef.current.style.transform = `translateY(${deltaY}px)`;
          sheetRef.current.style.transition = "none";
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current !== null && sheetRef.current) {
      const deltaY = touchCurrentY.current - touchStartY.current;

      if (deltaY > 120) {
        // Swiped down far enough to close
        handleClose();
      } else {
        // Snap back
        sheetRef.current.style.transform = "";
        sheetRef.current.style.transition = "";
      }
    }

    touchStartY.current = null;
  }, [handleClose]);

  // ── Quantity stepper ────────────────────────────────────

  const handleDecrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity((q) => Math.min(20, q + 1));
  }, []);

  // ── Add to cart ─────────────────────────────────────────

  const handleAddToCart = useCallback(() => {
    if (!dish) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        dishId: dish.id,
        name: dish.name,
        price: activePrice,
        variantId: selectedVariantId ?? undefined,
        variantName: activeVariantName,
        notes: i === 0 ? notes || undefined : undefined,
      });
    }

    setJustAdded(true);
    setTimeout(() => {
      handleClose();
    }, 500);
  }, [dish, quantity, addItem, activePrice, selectedVariantId, activeVariantName, notes, handleClose]);

  // ── Guard: don't render if not open and not closing ─────

  if (!isOpen && !isClosing) return null;
  if (!dish) return null;

  // ── Macros helper ───────────────────────────────────────

  const hasMacros =
    (dish.calories != null && dish.calories > 0) ||
    (dish.protein != null && dish.protein > 0) ||
    (dish.carbohydrates != null && dish.carbohydrates > 0) ||
    (dish.fats != null && dish.fats > 0);

  const macroItems: Array<{ label: string; value: string }> = [];

  if (dish.calories != null && dish.calories > 0) {
    macroItems.push({ label: "kcal", value: String(dish.calories) });
  }

  if (dish.protein != null && dish.protein > 0) {
    macroItems.push({ label: t("publicMenu.dishDetail.protein"), value: `${dish.protein}g` });
  }

  if (dish.carbohydrates != null && dish.carbohydrates > 0) {
    macroItems.push({ label: t("publicMenu.dishDetail.carbs"), value: `${dish.carbohydrates}g` });
  }

  if (dish.fats != null && dish.fats > 0) {
    macroItems.push({ label: t("publicMenu.dishDetail.fat"), value: `${dish.fats}g` });
  }

  // ── Total price ─────────────────────────────────────────

  const totalPrice = activePrice * quantity;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: isClosing
            ? "dishSheetOverlayOut 0.28s ease forwards"
            : "dishSheetOverlayIn 0.28s ease forwards",
        }}
        aria-hidden="true"
      />

      {/* Sheet / Modal */}
      <div
        ref={mergedSheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={dish.name}
        data-dish-detail-sheet
        onKeyDown={handleTrapKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed",
          zIndex: 51,
          backgroundColor: "var(--menu-surface)",
          color: "var(--menu-text)",
          fontFamily: "var(--menu-body-font)",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          // Mobile: bottom sheet
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "92vh",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          animation: isClosing
            ? "dishSheetSlideDown 0.28s cubic-bezier(0.4, 0, 1, 1) forwards"
            : "dishSheetSlideUp 0.32s cubic-bezier(0, 0, 0.2, 1) forwards",
          boxShadow: "0 -4px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Drag handle (mobile) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 4px",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "var(--menu-border)",
            }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            transition: "background-color 0.15s ease",
          }}
        >
          <CloseIcon />
        </button>

        {/* Hero image or placeholder gradient */}
        {dish.pictureUrl ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "220px",
              overflow: "hidden",
            }}
          >
            <Image
              src={dish.pictureUrl}
              alt={dish.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 520px"
              priority
              placeholder="blur"
              blurDataURL={shimmerToBase64(520, 220)}
            />
            {/* Gradient fade at bottom for text readability */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60px",
                background: "linear-gradient(to top, var(--menu-surface), transparent)",
                pointerEvents: "none",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100px",
              background: "linear-gradient(135deg, var(--menu-primary), var(--menu-accent, var(--menu-primary)))",
              opacity: 0.15,
            }}
          />
        )}

        {/* Content */}
        <div style={{ padding: "0 20px 16px" }}>
          {/* Dish name */}
          <h2
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-2xl, 1.5rem)",
              fontWeight: 700,
              color: "var(--menu-text)",
              margin: "12px 0 0",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {dish.name}
          </h2>

          {/* Price */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                color: "var(--menu-primary)",
                fontWeight: 700,
                fontSize: "var(--menu-font-xl, 1.25rem)",
                fontFamily: "var(--menu-body-font)",
              }}
            >
              {formatPrice(activePrice)}
            </span>
            <span
              style={{
                fontSize: "var(--menu-font-sm)",
                fontWeight: 400,
                color: "var(--menu-muted)",
              }}
            >
              {getCurrencySymbol(currency)}
            </span>
          </div>

          {/* Sold out badge */}
          {dish.isSoldOut && (
            <div
              style={{
                display: "inline-block",
                backgroundColor: "var(--menu-accent, #dc2626)",
                color: "#fff",
                fontSize: "var(--menu-font-sm)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "4px 14px",
                borderRadius: "9999px",
                marginTop: "10px",
              }}
            >
              {t("publicMenu.soldOut")}
            </div>
          )}

          {/* Description */}
          {dish.description && dish.description !== "-" && (
            <p
              style={{
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-base)",
                color: "var(--menu-muted)",
                marginTop: "14px",
                lineHeight: 1.6,
              }}
            >
              {dish.description}
            </p>
          )}

          {/* Tags */}
          {dish.dishesTag && dish.dishesTag.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "12px",
              }}
            >
              {dish.dishesTag.map(({ tagName }, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "var(--menu-font-sm)",
                    color: "var(--menu-accent)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--menu-accent)",
                    padding: "2px 10px",
                    borderRadius: "9999px",
                    fontWeight: 500,
                  }}
                >
                  {tagName}
                </span>
              ))}
            </div>
          )}

          {/* Nutrition / Macros */}
          {hasMacros && (
            <div style={{ marginTop: "16px" }}>
              <h4
                style={{
                  fontFamily: "var(--menu-heading-font)",
                  fontSize: "var(--menu-font-sm)",
                  fontWeight: 600,
                  color: "var(--menu-text)",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("publicMenu.dishDetail.nutrition")}
              </h4>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {macroItems.map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "8px 14px",
                      borderRadius: "12px",
                      backgroundColor: "var(--menu-background, var(--menu-surface))",
                      border: "1px solid var(--menu-border)",
                      minWidth: "60px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "var(--menu-font-base)",
                        color: "var(--menu-text)",
                        lineHeight: 1.2,
                      }}
                    >
                      {value}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--menu-muted)",
                        marginTop: "2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variant selector */}
          {translatedVariants.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4
                style={{
                  fontFamily: "var(--menu-heading-font)",
                  fontSize: "var(--menu-font-sm)",
                  fontWeight: 600,
                  color: "var(--menu-text)",
                  margin: "0 0 10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("publicMenu.dishDetail.selectVariant")}
              </h4>
              <div
                role="radiogroup"
                aria-label={t("publicMenu.dishDetail.selectVariant")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {translatedVariants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedVariantId(variant.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: isSelected
                          ? "2px solid var(--menu-primary)"
                          : "1px solid var(--menu-border)",
                        backgroundColor: isSelected
                          ? "rgba(var(--menu-primary-rgb, 0, 0, 0), 0.06)"
                          : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "var(--menu-body-font)",
                        transition: "all 0.15s ease",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {/* Radio indicator */}
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            border: isSelected
                              ? "2px solid var(--menu-primary)"
                              : "2px solid var(--menu-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.15s ease",
                            backgroundColor: isSelected
                              ? "var(--menu-primary)"
                              : "transparent",
                          }}
                        >
                          {isSelected && (
                            <div style={{ color: "var(--menu-surface)" }}>
                              <CheckIcon />
                            </div>
                          )}
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: "var(--menu-font-base)",
                              fontWeight: isSelected ? 600 : 400,
                              color: "var(--menu-text)",
                            }}
                          >
                            {variant.name || ""}
                          </span>
                          {variant.description && (
                            <span
                              style={{
                                display: "block",
                                fontSize: "var(--menu-font-sm)",
                                color: "var(--menu-muted)",
                                marginTop: "2px",
                              }}
                            >
                              {variant.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {variant.price != null && variant.price > 0 && (
                        <span
                          style={{
                            color: "var(--menu-primary)",
                            fontWeight: 600,
                            fontSize: "var(--menu-font-base)",
                            whiteSpace: "nowrap",
                            marginLeft: "8px",
                          }}
                        >
                          {formatPrice(variant.price)} {getCurrencySymbol(currency)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity stepper */}
          {!dish.isSoldOut && (
            <div style={{ marginTop: "20px" }}>
              <h4
                style={{
                  fontFamily: "var(--menu-heading-font)",
                  fontSize: "var(--menu-font-sm)",
                  fontWeight: 600,
                  color: "var(--menu-text)",
                  margin: "0 0 10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("publicMenu.dishDetail.quantity")}
              </h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0",
                  borderRadius: "14px",
                  border: "1.5px solid var(--menu-border)",
                  overflow: "hidden",
                  width: "fit-content",
                }}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    height: "44px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: quantity <= 1 ? "var(--menu-border)" : "var(--menu-text)",
                    cursor: quantity <= 1 ? "default" : "pointer",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    transition: "color 0.15s ease",
                  }}
                >
                  <MinusIcon />
                </button>
                <span
                  aria-live="polite"
                  style={{
                    fontFamily: "var(--menu-body-font)",
                    fontSize: "var(--menu-font-lg)",
                    fontWeight: 700,
                    color: "var(--menu-text)",
                    minWidth: "40px",
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
                  disabled={quantity >= 20}
                  aria-label="Increase quantity"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    height: "44px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: quantity >= 20 ? "var(--menu-border)" : "var(--menu-text)",
                    cursor: quantity >= 20 ? "default" : "pointer",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    transition: "color 0.15s ease",
                  }}
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {!dish.isSoldOut && (
            <div style={{ marginTop: "20px" }}>
              <h4
                style={{
                  fontFamily: "var(--menu-heading-font)",
                  fontSize: "var(--menu-font-sm)",
                  fontWeight: 600,
                  color: "var(--menu-text)",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("publicMenu.dishDetail.notes")}
              </h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-label={t("publicMenu.dishDetail.notesPlaceholder")}
                placeholder={t("publicMenu.dishDetail.notesPlaceholder")}
                maxLength={200}
                rows={2}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--menu-border)",
                  backgroundColor: "var(--menu-background, var(--menu-surface))",
                  color: "var(--menu-text)",
                  fontFamily: "var(--menu-body-font)",
                  fontSize: "var(--menu-font-base)",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--menu-primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--menu-border)";
                }}
              />
            </div>
          )}
        </div>

        {/* Sticky bottom CTA */}
        {!dish.isSoldOut && (
          <div
            data-dish-detail-cta
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 52,
              padding: "12px 20px",
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              backgroundColor: "var(--menu-surface)",
              borderTop: "1px solid var(--menu-border)",
              boxShadow: "0 -2px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <button
              type="button"
              onClick={handleAddToCart}
              style={{
                width: "100%",
                padding: "16px 24px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: justAdded
                  ? "var(--menu-accent, #16a34a)"
                  : "var(--menu-primary)",
                color: "#fff",
                fontFamily: "var(--menu-heading-font)",
                fontSize: "var(--menu-font-lg)",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                transition: "background-color 0.2s ease, transform 0.15s ease",
                animation: justAdded ? "dishSheetAddedPulse 0.3s ease" : "none",
              }}
            >
              <span>
                {justAdded
                  ? t("publicMenu.dishDetail.added")
                  : t("publicMenu.dishDetail.addToOrder")}
              </span>
              {!justAdded && (
                <span
                  style={{
                    opacity: 0.85,
                    fontWeight: 500,
                    fontSize: "var(--menu-font-base)",
                  }}
                >
                  {formatPrice(totalPrice)} {getCurrencySymbol(currency)}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Desktop media query override */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media (min-width: 768px) {
  [data-dish-detail-sheet] {
    bottom: auto !important;
    left: 50% !important;
    right: auto !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    max-width: 520px !important;
    max-height: 85vh !important;
    width: 90vw !important;
    border-radius: 20px !important;
    animation: ${isClosing ? "dishSheetScaleOut" : "dishSheetScaleIn"} 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
  }
  [data-dish-detail-sheet] > div:first-child {
    display: none !important;
  }
}
`,
        }}
      />
    </>
  );
}
