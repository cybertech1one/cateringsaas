"use client";

import { useState } from "react";
import { ChevronDown, Leaf } from "lucide-react";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

interface CateringItem {
  id: string;
  name: string;
  nameAr?: string | null;
  nameFr?: string | null;
  description?: string | null;
  pricePerPerson?: number | null;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isAvailable?: boolean;
}

interface CateringCategory {
  id: string;
  name: string;
  description?: string | null;
  isOptional?: boolean;
  cateringItems: CateringItem[];
}

interface MenuItemsExpanderProps {
  categories: CateringCategory[];
  currency?: string;
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

export function MenuItemsExpander({
  categories,
  currency = "MAD",
}: MenuItemsExpanderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalItems = categories.reduce(
    (sum, cat) => sum + cat.cateringItems.length,
    0,
  );

  if (categories.length === 0 || totalItems === 0) return null;

  return (
    <div className="mt-4 border-t border-border/30 pt-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isExpanded}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          {totalItems} item{totalItems !== 1 ? "s" : ""} across{" "}
          {categories.length} section
          {categories.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4 animate-fade-up" style={{ animationDuration: "0.3s" }}>
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-xs font-bold text-foreground/80">
                  {cat.name}
                </h4>
                {cat.isOptional && (
                  <span className="rounded-full bg-gold/[0.08] px-1.5 py-0.5 text-[9px] font-medium text-gold/70">
                    Optional
                  </span>
                )}
              </div>
              {cat.description && (
                <p className="mb-2 text-[10px] text-muted-foreground/50">
                  {cat.description}
                </p>
              )}
              <div className="space-y-1">
                {cat.cateringItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-sand/50"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="truncate text-foreground/70">
                        {item.name}
                      </span>
                      {(item.isVegetarian || item.isVegan) && (
                        <Leaf className="h-2.5 w-2.5 flex-shrink-0 text-sage/60" />
                      )}
                    </div>
                    {item.pricePerPerson != null && item.pricePerPerson > 0 && (
                      <span className="ml-2 flex-shrink-0 text-[10px] font-medium text-ember/70">
                        +{item.pricePerPerson} {currency}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
