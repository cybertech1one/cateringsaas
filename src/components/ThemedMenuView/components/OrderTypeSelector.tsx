"use client";

import { useTranslation } from "react-i18next";

interface OrderTypeSelectorProps {
  enabledTypes: string[];
  selected: string;
  onSelect: (type: string) => void;
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "orderTracking.orderType.dine_in",
  pickup: "orderTracking.orderType.pickup",
  delivery: "orderTracking.orderType.delivery",
};

export function OrderTypeSelector({
  enabledTypes,
  selected,
  onSelect,
}: OrderTypeSelectorProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string) => string;

  // If only one type enabled, don't render the selector
  if (enabledTypes.length <= 1) return null;

  return (
    <div
      role="radiogroup"
      aria-label={t("orderTracking.orderType.label")}
      style={{
        display: "flex",
        gap: "8px",
        padding: "0 0 16px",
      }}
    >
      {enabledTypes.map((type) => {
        const isSelected = type === selected;
        const labelKey = ORDER_TYPE_LABELS[type] ?? type;

        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(type)}
            style={{
              flex: 1,
              backgroundColor: isSelected
                ? "var(--menu-primary)"
                : "var(--menu-surface)",
              color: isSelected ? "#fff" : "var(--menu-text)",
              border: `1px solid ${isSelected ? "var(--menu-primary)" : "var(--menu-border)"}`,
              borderRadius: "var(--menu-radius, 8px)",
              padding: "10px 16px",
              cursor: "pointer",
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-sm)",
              fontWeight: isSelected ? 600 : 500,
              transition: "all 0.15s",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
