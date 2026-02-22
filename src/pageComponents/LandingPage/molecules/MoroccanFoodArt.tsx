"use client";

export const MoroccanFoodArt = () => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square" aria-hidden="true">
      {/* Subtle geometric background */}
      <div className="absolute inset-0 moroccan-geo rounded-full opacity-30" />

      {/* ── Tagine (center piece) ────────────────────── */}
      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-48 h-52 sm:w-56 sm:h-60">
        {/* Lid — conical shape */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-24 sm:w-24 sm:h-28"
          style={{
            background: "linear-gradient(180deg, hsl(var(--terracotta)) 0%, hsl(var(--ember)) 100%)",
            clipPath: "polygon(50% 0%, 85% 100%, 15% 100%)",
            filter: "drop-shadow(0 4px 12px hsla(var(--terracotta), 0.3))",
          }}
        />
        {/* Knob */}
        <div
          className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md"
          style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(42 70% 45%))" }}
        />
        {/* Decorative band on lid */}
        <div
          className="absolute top-[55%] left-1/2 -translate-x-1/2 w-12 sm:w-14 h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--gold)), transparent)" }}
        />
        {/* Base plate */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-14 sm:w-48 sm:h-16 rounded-b-full"
          style={{
            background: "linear-gradient(180deg, hsl(var(--ember-light)) 0%, hsl(var(--terracotta)) 100%)",
            boxShadow: "0 8px 32px -8px hsla(var(--terracotta), 0.35)",
          }}
        />
        {/* Steam wisps */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-3">
          <div
            className="w-[3px] h-8 rounded-full animate-float opacity-20"
            style={{ background: "linear-gradient(to top, hsl(var(--ember-light)), transparent)" }}
          />
          <div
            className="w-[2px] h-6 rounded-full animate-float opacity-15"
            style={{ background: "linear-gradient(to top, hsl(var(--ember-light)), transparent)", animationDelay: "0.5s" }}
          />
          <div
            className="w-[3px] h-7 rounded-full animate-float opacity-20"
            style={{ background: "linear-gradient(to top, hsl(var(--ember-light)), transparent)", animationDelay: "1s" }}
          />
        </div>
      </div>

      {/* ── Mint Tea Glass (bottom-left) ─────────────── */}
      <div className="absolute bottom-[12%] left-[5%] w-16 h-24 sm:w-20 sm:h-28 animate-float" style={{ animationDelay: "0.8s" }}>
        {/* Glass body */}
        <div
          className="absolute bottom-0 w-full h-[85%] rounded-b-lg"
          style={{
            background: "linear-gradient(180deg, hsla(var(--mint), 0.15) 0%, hsla(var(--mint), 0.3) 60%, hsla(var(--mint), 0.45) 100%)",
            border: "1.5px solid hsla(var(--gold), 0.35)",
            borderTop: "none",
          }}
        />
        {/* Gold rim at top */}
        <div
          className="absolute top-[15%] left-0 right-0 h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--gold)), transparent)", opacity: 0.6 }}
        />
        {/* Gold ornamental band */}
        <div
          className="absolute bottom-[35%] left-[10%] right-[10%] h-[1.5px] rounded-full"
          style={{ background: "hsl(var(--gold))", opacity: 0.25 }}
        />
        {/* Mint leaf */}
        <div
          className="absolute -top-1 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-tl-full rounded-br-full"
          style={{ background: "linear-gradient(135deg, hsl(var(--sage)) 0%, hsl(var(--mint)) 100%)" }}
        />
        {/* Second leaf */}
        <div
          className="absolute -top-2 right-3 w-3 h-4 sm:w-4 sm:h-5 rounded-tl-full rounded-br-full opacity-60"
          style={{ background: "linear-gradient(135deg, hsl(var(--mint)) 0%, hsl(var(--sage)) 100%)", transform: "rotate(-30deg)" }}
        />
      </div>

      {/* ── Couscous Bowl (bottom-right) ─────────────── */}
      <div className="absolute bottom-[10%] right-[5%] w-24 h-16 sm:w-32 sm:h-20 animate-float" style={{ animationDelay: "1.5s" }}>
        {/* Bowl */}
        <div
          className="w-full h-full rounded-b-full"
          style={{
            background: "linear-gradient(180deg, hsl(var(--gold)) 0%, hsl(42 70% 45%) 100%)",
            boxShadow: "0 6px 24px -6px hsla(var(--gold), 0.3)",
          }}
        />
        {/* Couscous mound */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-7 sm:w-24 sm:h-10 rounded-t-full"
          style={{ background: "radial-gradient(ellipse at bottom, hsl(42 55% 65%) 0%, hsl(42 45% 75%) 100%)" }}
        />
        {/* Decorative herbs on top */}
        <div
          className="absolute -top-5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{ background: "hsl(var(--sage))", opacity: 0.5 }}
        />
      </div>

      {/* ── Decorative 8-pointed Star (top-right) ───── */}
      <svg
        className="absolute top-[3%] right-[8%] w-14 h-14 sm:w-18 sm:h-18"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "hsl(var(--gold))", opacity: 0.15, animation: "gentleRotate 8s ease-in-out infinite" }}
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>

      {/* Small star accent (left) */}
      <svg
        className="absolute top-[40%] left-[2%] w-8 h-8"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "hsl(var(--ember))", opacity: 0.1, animation: "gentleRotate 6s ease-in-out infinite reverse" }}
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>

      {/* ── Warm ambient glow ────────────────────────── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-primary/[0.05] blur-3xl" />
      <div className="absolute bottom-[15%] left-[20%] w-32 h-32 rounded-full bg-gold/[0.04] blur-3xl" />
    </div>
  );
};
