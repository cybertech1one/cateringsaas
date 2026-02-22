"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useFocusTrap } from "~/hooks/useFocusTrap";

// ── SVG Icons (inline to avoid external deps) ──────────────

function ShareIcon({ size = 20 }: { size?: number }) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Share Options Builder ────────────────────────────────────

interface ShareData {
  title: string;
  text: string;
  url: string;
}

function buildShareData(
  menuName: string,
  menuUrl: string,
  dishName?: string,
  dishAnchor?: string,
): ShareData {
  const url = dishAnchor ? `${menuUrl}#${dishAnchor}` : menuUrl;
  const text = dishName
    ? `Check out ${dishName} at ${menuName}!`
    : `Check out the menu at ${menuName}!`;

  return { title: menuName, text, url };
}

function openWhatsApp(data: ShareData) {
  const message = `${data.text} ${data.url}`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function openFacebook(data: ShareData) {
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
    "_blank",
    "noopener,noreferrer,width=600,height=400",
  );
}

function openTwitter(data: ShareData) {
  const tweet = `${data.text} ${data.url}`;

  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
    "_blank",
    "noopener,noreferrer,width=600,height=400",
  );
}

async function copyToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);

    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");

    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");

      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// ── Share Sheet Modal ───────────────────────────────────────

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  menuName: string;
  menuUrl: string;
  dishName?: string;
  dishAnchor?: string;
}

export function ShareSheet({
  isOpen,
  onClose,
  menuName,
  menuUrl,
  dishName,
  dishAnchor,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { containerRef: trapRef, handleKeyDown: handleTrapKeyDown } = useFocusTrap(isOpen);

  const data = buildShareData(menuName, menuUrl, dishName, dishAnchor);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(data.url);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data.url]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid closing immediately from the trigger click
    const timeout = setTimeout(() => {
      window.addEventListener("mousedown", handler);
    }, 0);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousedown", handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareOptions = [
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
      color: "#25D366",
      onClick: () => { openWhatsApp(data); onClose(); },
    },
    {
      label: "Facebook",
      icon: <FacebookIcon />,
      color: "#1877F2",
      onClick: () => { openFacebook(data); onClose(); },
    },
    {
      label: "X (Twitter)",
      icon: <XIcon />,
      color: "var(--menu-text)",
      onClick: () => { openTwitter(data); onClose(); },
    },
    {
      label: copied ? "Copied!" : "Copy Link",
      icon: copied ? <CheckIcon /> : <LinkIcon />,
      color: "var(--menu-primary)",
      onClick: () => void handleCopy(),
    },
  ];

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      />
      <div
        ref={trapRef}
        onKeyDown={handleTrapKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={dishName ? `Share ${dishName}` : "Share menu"}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "0 16px 16px",
          pointerEvents: "none",
        }}
      >
      <div
        ref={sheetRef}
        style={{
          pointerEvents: "auto",
          backgroundColor: "var(--menu-surface, #fff)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px",
          padding: "20px",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
          animation: "slideUp 200ms ease-out",
        }}
      >
        {/* Inject animation keyframes */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-lg)",
              fontWeight: 600,
              color: "var(--menu-text)",
              margin: 0,
            }}
          >
            {dishName ? `Share "${dishName}"` : "Share Menu"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--menu-muted)",
              padding: "4px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Share Options */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {shareOptions.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              aria-label={`Share via ${option.label}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "12px 4px",
                border: "1px solid var(--menu-border, #e5e5e5)",
                borderRadius: "12px",
                backgroundColor: "transparent",
                cursor: "pointer",
                transition: "background-color 150ms, transform 150ms",
                color: option.color,
                fontFamily: "var(--menu-body-font)",
                fontSize: "11px",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--menu-background, #f5f5f5)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {option.icon}
              <span style={{ color: "var(--menu-text)" }}>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}

// ── Floating Share Button ───────────────────────────────────

interface FloatingShareButtonProps {
  menuName: string;
  menuSlug: string;
}

export function FloatingShareButton({
  menuName,
  menuSlug,
}: FloatingShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${menuSlug}`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.diyafa.ma"}/menu/${menuSlug}`;

  const handleClick = useCallback(async () => {
    // Use native share on mobile if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: menuName,
          text: `Check out the menu at ${menuName}!`,
          url: menuUrl,
        });

        return;
      } catch {
        // User cancelled or share failed, fall through to modal
      }
    }

    setIsOpen(true);
  }, [menuName, menuUrl]);

  return (
    <>
      <button
        onClick={() => void handleClick()}
        aria-label="Share this menu"
        style={{
          position: "fixed",
          bottom: "90px",
          right: "24px",
          zIndex: 100,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--menu-primary)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          transition: "transform 200ms, box-shadow 200ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        }}
      >
        <ShareIcon size={22} />
      </button>

      <ShareSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        menuName={menuName}
        menuUrl={menuUrl}
      />
    </>
  );
}

// ── Inline Share Button (for dish cards) ────────────────────

interface DishShareButtonProps {
  menuName: string;
  menuSlug: string;
  dishName: string;
  dishId: string;
}

export function DishShareButton({
  menuName,
  menuSlug,
  dishName,
  dishId,
}: DishShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${menuSlug}`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.diyafa.ma"}/menu/${menuSlug}`;

  const handleClick = useCallback(async () => {
    const shareData = buildShareData(menuName, menuUrl, dishName, `dish-${dishId}`);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });

        return;
      } catch {
        // Fall through to modal
      }
    }

    setIsOpen(true);
  }, [menuName, menuUrl, dishName, dishId]);

  return (
    <>
      <button
        onClick={() => void handleClick()}
        aria-label={`Share ${dishName}`}
        title={`Share ${dishName}`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--menu-muted)",
          padding: "4px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 150ms, background-color 150ms",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--menu-primary)";
          e.currentTarget.style.backgroundColor = "var(--menu-surface, rgba(0,0,0,0.05))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--menu-muted)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <ShareIcon size={16} />
      </button>

      <ShareSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        menuName={menuName}
        menuUrl={menuUrl}
        dishName={dishName}
        dishAnchor={`dish-${dishId}`}
      />
    </>
  );
}

// ── Inline Share Buttons Row (for CTA banner) ──────────────

interface InlineShareButtonsProps {
  menuName: string;
  menuSlug: string;
}

export function InlineShareButtons({
  menuName,
  menuSlug,
}: InlineShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${menuSlug}`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.diyafa.ma"}/menu/${menuSlug}`;

  const data = buildShareData(menuName, menuUrl);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(data.url);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data.url]);

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid var(--menu-border, #e5e5e5)",
    backgroundColor: "transparent",
    cursor: "pointer",
    transition: "background-color 150ms, transform 150ms",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button
        onClick={() => openWhatsApp(data)}
        aria-label="Share on WhatsApp"
        style={{ ...buttonStyle, color: "#25D366" }}
      >
        <WhatsAppIcon />
      </button>
      <button
        onClick={() => openFacebook(data)}
        aria-label="Share on Facebook"
        style={{ ...buttonStyle, color: "#1877F2" }}
      >
        <FacebookIcon />
      </button>
      <button
        onClick={() => openTwitter(data)}
        aria-label="Share on X"
        style={{ ...buttonStyle, color: "var(--menu-text)" }}
      >
        <XIcon />
      </button>
      <button
        onClick={() => void handleCopy()}
        aria-label={copied ? "Link copied" : "Copy link"}
        style={{ ...buttonStyle, color: "var(--menu-primary)" }}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </button>
    </div>
  );
}
