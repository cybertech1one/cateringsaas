"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";

// ── Types ──────────────────────────────────────────────────

interface MenuSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number | null;
  totalCount: number;
  backgroundIsDark: boolean;
}

// ── Debounce Hook ──────────────────────────────────────────

function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ) as T;
}

// ── Search Icon SVG ────────────────────────────────────────

function SearchIcon() {
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
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ── Close Icon SVG ─────────────────────────────────────────

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Search Bar Styles ──────────────────────────────────────

export function MenuSearchBarStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes menuSearchExpand {
  from {
    width: 48px;
    padding-left: 48px;
    padding-right: 8px;
  }
  to {
    width: 100%;
    padding-left: 44px;
    padding-right: 44px;
  }
}
@keyframes menuSearchCountFade {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`,
      }}
    />
  );
}

// ── MenuSearchBar Component ────────────────────────────────

export const MenuSearchBar = memo(function MenuSearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
  backgroundIsDark,
}: MenuSearchBarProps) {
  const { t: rawT } = useTranslation("common");
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const [localValue, setLocalValue] = useState(value);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep expanded if there's a value
  const isActive = isExpanded || localValue.length > 0;

  // Sync local value when parent resets it
  useEffect(() => {
    if (value === "" && localValue !== "") {
      setLocalValue("");
    }
  }, [value, localValue]);

  // Close on click outside when expanded (only if empty)
  useEffect(() => {
    if (!isExpanded || localValue.length > 0) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, localValue.length]);

  const debouncedOnChange = useDebouncedCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    300,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleSearchClick = () => {
    if (!isActive) {
      setIsExpanded(true);
      // Focus input after expansion animation starts
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--menu-border)";
    e.currentTarget.style.boxShadow = "none";
    // Collapse if empty on blur
    if (localValue.length === 0) {
      // Small delay to allow click events to register
      setTimeout(() => {
        setIsExpanded(false);
      }, 150);
    }
  };

  const isFiltering = value.length > 0;

  return (
    <div
      ref={containerRef}
      style={{
        width: isActive ? "100%" : "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <MenuSearchBarStyles />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: isActive ? "100%" : "48px",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Search icon / button when collapsed */}
        {!isActive ? (
          <button
            type="button"
            onClick={handleSearchClick}
            aria-label={t("publicMenu.openSearch")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "var(--menu-radius-lg, 12px)",
              border: "1px solid var(--menu-border)",
              backgroundColor: backgroundIsDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.04)",
              color: "var(--menu-muted)",
              cursor: "pointer",
              transition: "background-color 0.2s, border-color 0.2s",
              WebkitTapHighlightColor: "transparent",
              flexShrink: 0,
            }}
          >
            <SearchIcon />
          </button>
        ) : (
          <>
            {/* Search icon (inside expanded input) */}
            <div
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--menu-muted)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <SearchIcon />
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={handleChange}
              placeholder={t("publicMenu.searchDishes")}
              aria-label={t("publicMenu.searchDishes")}
              style={{
                width: "100%",
                height: "48px",
                padding: "0 44px 0 44px",
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-base)",
                color: "var(--menu-text)",
                backgroundColor: backgroundIsDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.04)",
                border: "1px solid var(--menu-border)",
                borderRadius: "var(--menu-radius-lg, 12px)",
                outline: "none",
                transition:
                  "border-color 0.2s, box-shadow 0.2s",
                WebkitAppearance: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--menu-primary)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(var(--menu-primary), 0.15)";
              }}
              onBlur={handleBlur}
            />

            {/* Clear button */}
            {localValue.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                aria-label={t("publicMenu.clearSearch")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: backgroundIsDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.08)",
                  color: "var(--menu-muted)",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <CloseIcon />
              </button>
            )}
          </>
        )}
      </div>

      {/* Result count indicator */}
      {isFiltering && resultCount !== null && (
        <div
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            paddingLeft: "4px",
            animation: "menuSearchCountFade 0.2s ease-out both",
          }}
          aria-live="polite"
        >
          {resultCount === 0
            ? t("publicMenu.noResults")
            : t("publicMenu.searchResultCount", { found: resultCount, total: totalCount })}
        </div>
      )}
    </div>
  );
});
