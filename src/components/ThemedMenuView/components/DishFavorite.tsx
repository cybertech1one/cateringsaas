"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
} from "react";

// ── SVG Icons ───────────────────────────────────────────────

function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function FilterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

// ── Local Storage Helpers ───────────────────────────────────

const FAVORITES_KEY_PREFIX = "feastqr_favorites_";

function getStorageKey(menuSlug: string): string {
  return `${FAVORITES_KEY_PREFIX}${menuSlug}`;
}

function loadFavorites(menuSlug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getStorageKey(menuSlug));

    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];

    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(menuSlug: string, favorites: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(menuSlug),
      JSON.stringify(Array.from(favorites)),
    );
  } catch {
    // Storage full or unavailable, silently fail
  }
}

// ── Favorites Context ───────────────────────────────────────

interface FavoritesContextValue {
  favorites: Set<string>;
  toggleFavorite: (dishId: string) => void;
  isFavorite: (dishId: string) => boolean;
  favoritesCount: number;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: new Set(),
  toggleFavorite: () => undefined,
  isFavorite: () => false,
  favoritesCount: 0,
  showFavoritesOnly: false,
  setShowFavoritesOnly: () => undefined,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

// ── Favorites Provider ──────────────────────────────────────

interface FavoritesProviderProps {
  menuSlug: string;
  children: ReactNode;
}

export function FavoritesProvider({ menuSlug, children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setFavorites(loadFavorites(menuSlug));
  }, [menuSlug]);

  const toggleFavorite = useCallback(
    (dishId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);

        if (next.has(dishId)) {
          next.delete(dishId);
        } else {
          next.add(dishId);
        }

        saveFavorites(menuSlug, next);

        return next;
      });
    },
    [menuSlug],
  );

  const isFavorite = useCallback(
    (dishId: string) => favorites.has(dishId),
    [favorites],
  );

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      favoritesCount: favorites.size,
      showFavoritesOnly,
      setShowFavoritesOnly,
    }),
    [favorites, toggleFavorite, isFavorite, showFavoritesOnly, setShowFavoritesOnly],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ── Favorite Heart Button (for dish cards) ──────────────────

interface DishFavoriteButtonProps {
  dishId: string;
}

export function DishFavoriteButton({ dishId }: DishFavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const filled = isFavorite(dishId);
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback(() => {
    toggleFavorite(dishId);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
  }, [dishId, toggleFavorite]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes heartPop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }`,
        }}
      />
      <button
        onClick={handleClick}
        aria-label={filled ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={filled}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: filled ? "#ef4444" : "var(--menu-muted)",
          padding: "4px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 200ms",
          animation: animating ? "heartPop 300ms ease" : "none",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!filled) {
            e.currentTarget.style.color = "#ef4444";
          }
        }}
        onMouseLeave={(e) => {
          if (!filled) {
            e.currentTarget.style.color = "var(--menu-muted)";
          }
        }}
      >
        <HeartIcon filled={filled} size={18} />
      </button>
    </>
  );
}

// ── Favorites Filter Button ─────────────────────────────────

export function FavoritesFilterButton() {
  const { favoritesCount, showFavoritesOnly, setShowFavoritesOnly } = useFavorites();

  if (favoritesCount === 0) return null;

  return (
    <button
      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
      aria-label={
        showFavoritesOnly ? "Show all dishes" : `Show ${favoritesCount} favorite dishes`
      }
      aria-pressed={showFavoritesOnly}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        border: showFavoritesOnly
          ? "2px solid var(--menu-primary)"
          : "1px solid var(--menu-border, #e5e5e5)",
        borderRadius: "9999px",
        backgroundColor: showFavoritesOnly
          ? "var(--menu-primary)"
          : "var(--menu-surface, #fff)",
        color: showFavoritesOnly ? "#fff" : "var(--menu-text)",
        cursor: "pointer",
        fontFamily: "var(--menu-body-font)",
        fontSize: "var(--menu-font-sm)",
        fontWeight: 500,
        transition: "all 200ms",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!showFavoritesOnly) {
          e.currentTarget.style.borderColor = "var(--menu-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!showFavoritesOnly) {
          e.currentTarget.style.borderColor = "var(--menu-border, #e5e5e5)";
        }
      }}
    >
      <HeartIcon filled={showFavoritesOnly} size={14} />
      <span>
        {showFavoritesOnly ? "Show All" : "Favorites"}
      </span>
      {/* Badge count */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "20px",
          height: "20px",
          borderRadius: "9999px",
          backgroundColor: showFavoritesOnly ? "rgba(255,255,255,0.3)" : "#ef4444",
          color: "#fff",
          fontSize: "11px",
          fontWeight: 600,
          padding: "0 6px",
        }}
      >
        {favoritesCount}
      </span>
    </button>
  );
}

// ── Filter Icon Inline ─────────────────────────────────────

export function FavoritesFilterIcon() {
  const { favoritesCount, showFavoritesOnly, setShowFavoritesOnly } = useFavorites();

  if (favoritesCount === 0) return null;

  return (
    <button
      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
      aria-label={
        showFavoritesOnly ? "Show all dishes" : `Filter to ${favoritesCount} favorites`
      }
      style={{
        position: "relative",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: showFavoritesOnly ? "var(--menu-primary)" : "var(--menu-muted)",
        padding: "6px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 150ms",
      }}
    >
      <FilterIcon size={18} />
      {/* Badge */}
      <span
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: "#ef4444",
          color: "#fff",
          fontSize: "10px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        {favoritesCount}
      </span>
    </button>
  );
}
