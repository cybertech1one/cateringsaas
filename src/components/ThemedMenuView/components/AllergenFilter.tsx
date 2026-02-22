"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";

// ── Types ──────────────────────────────────────────────────

export interface AllergenInfo {
  id: string;
  name: string;
  icon: string | null;
  type: string | null;
}

interface AllergenFilterProps {
  /** Unique allergens present across the entire menu */
  allergens: AllergenInfo[];
  /** Currently selected allergen IDs to exclude */
  selectedAllergenIds: Set<string>;
  /** Toggle one allergen on/off */
  onToggleAllergen: (allergenId: string) => void;
  /** Clear all selections */
  onClearAll: () => void;
  /** Whether the background theme is dark */
  backgroundIsDark: boolean;
}

// ── Allergen Emoji Map ─────────────────────────────────────

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: "🌾",
  crustaceans: "🦐",
  eggs: "🥚",
  fish: "🐟",
  peanuts: "🥜",
  soybeans: "🫘",
  dairy: "🥛",
  nuts: "🌰",
  celery: "🥬",
  mustard: "🟡",
  sesame: "🫓",
  sulphites: "🍷",
  lupin: "🌸",
  molluscs: "🦪",
};

function getAllergenIcon(allergen: AllergenInfo): string {
  if (allergen.icon) return allergen.icon;
  if (allergen.type && allergen.type in ALLERGEN_ICONS) {
    return ALLERGEN_ICONS[allergen.type]!;
  }

  // Fallback: try matching by name (lowercase)
  const nameLower = allergen.name.toLowerCase();

  for (const [key, emoji] of Object.entries(ALLERGEN_ICONS)) {
    if (nameLower.includes(key)) return emoji;
  }

  return "⚠️";
}

// ── Style helpers (avoid nested ternaries) ─────────────────

function getInactiveBackground(isDark: boolean): string {
  return isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)";
}

function getSelectedItemBackground(isDark: boolean): string {
  return isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
}

function getCheckboxColor(isDark: boolean): string {
  return isDark ? "var(--menu-background)" : "#fff";
}

function getSeverityPrefix(severity?: string): string {
  if (severity === "may_contain") return "May contain: ";
  if (severity === "traces") return "Traces of: ";

  return "";
}

// ── Filter Icon SVG ────────────────────────────────────────

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

// ── Close Icon SVG ─────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
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

// ── Check Icon SVG ─────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
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

// ── AllergenFilter Component ───────────────────────────────

export const AllergenFilter = memo(function AllergenFilter({
  allergens,
  selectedAllergenIds,
  onToggleAllergen,
  onClearAll,
  backgroundIsDark,
}: AllergenFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdown on outside click (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMobile]);

  // Prevent body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && isOpen) {
      const previousOverflow = document.body.style.overflow;

      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isMobile, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const activeCount = selectedAllergenIds.size;

  if (allergens.length === 0) return null;

  return (
    <div ref={containerRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Filter trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Filter allergens${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          height: "48px",
          padding: "0 16px",
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-sm)",
          fontWeight: 500,
          color: activeCount > 0 ? "var(--menu-background)" : "var(--menu-text)",
          backgroundColor: activeCount > 0
            ? "var(--menu-primary)"
            : getInactiveBackground(backgroundIsDark),
          border: activeCount > 0
            ? "1px solid var(--menu-primary)"
            : "1px solid var(--menu-border)",
          borderRadius: "var(--menu-radius-lg, 12px)",
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        <FilterIcon />
        <span>Allergens</span>
        {activeCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "20px",
              height: "20px",
              padding: "0 6px",
              borderRadius: "10px",
              backgroundColor: "var(--menu-background)",
              color: "var(--menu-primary)",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Desktop: Dropdown panel */}
      {isOpen && !isMobile && (
        <DesktopDropdown
          allergens={allergens}
          selectedAllergenIds={selectedAllergenIds}
          onToggleAllergen={onToggleAllergen}
          onClearAll={onClearAll}
          activeCount={activeCount}
          backgroundIsDark={backgroundIsDark}
        />
      )}

      {/* Mobile: Bottom sheet */}
      {isOpen && isMobile && (
        <MobileBottomSheet
          allergens={allergens}
          selectedAllergenIds={selectedAllergenIds}
          onToggleAllergen={onToggleAllergen}
          onClearAll={onClearAll}
          onClose={() => setIsOpen(false)}
          activeCount={activeCount}
          backgroundIsDark={backgroundIsDark}
        />
      )}
    </div>
  );
});

// ── Desktop Dropdown ───────────────────────────────────────

function DesktopDropdown({
  allergens,
  selectedAllergenIds,
  onToggleAllergen,
  onClearAll,
  activeCount,
  backgroundIsDark,
}: {
  allergens: AllergenInfo[];
  selectedAllergenIds: Set<string>;
  onToggleAllergen: (id: string) => void;
  onClearAll: () => void;
  activeCount: number;
  backgroundIsDark: boolean;
}) {
  return (
    <div
      role="listbox"
      aria-label="Allergen filters"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        zIndex: 50,
        minWidth: "280px",
        maxWidth: "340px",
        maxHeight: "400px",
        backgroundColor: backgroundIsDark
          ? "rgba(30,30,40,0.97)"
          : "rgba(255,255,255,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "var(--menu-radius-lg, 12px)",
        border: "1px solid var(--menu-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        overflow: "hidden",
        animation: "menuFilterDropdownIn 0.15s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--menu-border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            fontWeight: 600,
            color: "var(--menu-text)",
          }}
        >
          Hide dishes containing:
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-sm)",
              color: "var(--menu-primary)",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: "4px",
              transition: "opacity 0.15s",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Allergen list */}
      <div
        style={{
          padding: "8px",
          overflowY: "auto",
          maxHeight: "320px",
        }}
      >
        {allergens.map((allergen) => (
          <AllergenCheckboxItem
            key={allergen.id}
            allergen={allergen}
            isSelected={selectedAllergenIds.has(allergen.id)}
            onToggle={() => onToggleAllergen(allergen.id)}
            backgroundIsDark={backgroundIsDark}
          />
        ))}
      </div>
    </div>
  );
}

// ── Mobile Bottom Sheet ────────────────────────────────────

function MobileBottomSheet({
  allergens,
  selectedAllergenIds,
  onToggleAllergen,
  onClearAll,
  onClose,
  activeCount,
  backgroundIsDark,
}: {
  allergens: AllergenInfo[];
  selectedAllergenIds: Set<string>;
  onToggleAllergen: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  activeCount: number;
  backgroundIsDark: boolean;
}) {
  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 998,
          animation: "menuFilterFadeIn 0.2s ease-out",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Allergen filters"
        aria-modal="true"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          backgroundColor: backgroundIsDark
            ? "rgba(30,30,40,0.98)"
            : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          animation: "menuFilterSlideUp 0.25s ease-out",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 4px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "var(--menu-muted)",
              opacity: 0.4,
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "8px 20px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--menu-border)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-lg)",
              fontWeight: 600,
              color: "var(--menu-text)",
            }}
          >
            Hide dishes containing:
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close allergen filter"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: backgroundIsDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.06)",
              color: "var(--menu-muted)",
              cursor: "pointer",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Allergen list */}
        <div
          style={{
            padding: "8px 12px",
            overflowY: "auto",
            flex: 1,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {allergens.map((allergen) => (
            <AllergenCheckboxItem
              key={allergen.id}
              allergen={allergen}
              isSelected={selectedAllergenIds.has(allergen.id)}
              onToggle={() => onToggleAllergen(allergen.id)}
              backgroundIsDark={backgroundIsDark}
            />
          ))}
        </div>

        {/* Footer with clear all */}
        {activeCount > 0 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--menu-border)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={onClearAll}
              style={{
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-base)",
                color: "var(--menu-primary)",
                backgroundColor: "transparent",
                border: "1px solid var(--menu-primary)",
                borderRadius: "var(--menu-radius, 8px)",
                padding: "10px 24px",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.15s",
                width: "100%",
              }}
            >
              Clear all filters ({activeCount})
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Single Allergen Checkbox Item ──────────────────────────

function AllergenCheckboxItem({
  allergen,
  isSelected,
  onToggle,
  backgroundIsDark,
}: {
  allergen: AllergenInfo;
  isSelected: boolean;
  onToggle: () => void;
  backgroundIsDark: boolean;
}) {
  const icon = getAllergenIcon(allergen);

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "10px 12px",
        border: "none",
        borderRadius: "var(--menu-radius, 8px)",
        backgroundColor: isSelected
          ? getSelectedItemBackground(backgroundIsDark)
          : "transparent",
        cursor: "pointer",
        transition: "background-color 0.12s",
        textAlign: "left",
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>
        {icon}
      </span>

      {/* Name */}
      <span
        style={{
          flex: 1,
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-base)",
          color: "var(--menu-text)",
          fontWeight: isSelected ? 600 : 400,
        }}
      >
        {allergen.name}
      </span>

      {/* Checkbox */}
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "6px",
          border: isSelected
            ? "2px solid var(--menu-primary)"
            : "2px solid var(--menu-muted)",
          backgroundColor: isSelected ? "var(--menu-primary)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
          flexShrink: 0,
          color: isSelected
            ? getCheckboxColor(backgroundIsDark)
            : "transparent",
        }}
      >
        {isSelected && <CheckIcon />}
      </div>
    </button>
  );
}

// ── Allergen Tag (for display on dish cards) ───────────────

export function AllergenTag({
  allergen,
  severity,
}: {
  allergen: AllergenInfo;
  severity?: string;
}) {
  const icon = getAllergenIcon(allergen);

  return (
    <span
      title={`${getSeverityPrefix(severity)}${allergen.name}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "var(--menu-font-sm)",
        color: "var(--menu-accent)",
        backgroundColor: "transparent",
        border: "1px solid var(--menu-accent)",
        padding: "1px 7px",
        borderRadius: "9999px",
        fontWeight: 500,
        fontFamily: "var(--menu-body-font)",
        lineHeight: 1.5,
        opacity: severity === "traces" ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: "12px" }}>{icon}</span>
      {allergen.name}
    </span>
  );
}

// ── CSS Keyframes (injected once) ──────────────────────────

export function AllergenFilterStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes menuFilterDropdownIn {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes menuFilterSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes menuFilterFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
`,
      }}
    />
  );
}
