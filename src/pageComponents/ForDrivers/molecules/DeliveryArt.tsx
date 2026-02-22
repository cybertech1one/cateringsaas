"use client";

export const DeliveryArt = () => {
  return (
    <div
      className="relative w-full max-w-md mx-auto aspect-square"
      aria-hidden="true"
    >
      {/* Subtle geometric background */}
      <div className="absolute inset-0 moroccan-geo rounded-full opacity-20" />

      {/* ── Moroccan Archway (background) ──────────────── */}
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-56 h-64 sm:w-64 sm:h-72">
        {/* Arch outline */}
        <div
          className="absolute bottom-0 w-full h-full"
          style={{
            borderRadius: "50% 50% 0 0",
            border: "2px solid hsla(var(--primary), 0.12)",
            borderBottom: "none",
          }}
        />
        {/* Inner arch */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[80%]"
          style={{
            borderRadius: "50% 50% 0 0",
            border: "1.5px solid hsla(var(--primary), 0.08)",
            borderBottom: "none",
          }}
        />
        {/* Keystone accent */}
        <div
          className="absolute top-[2%] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            opacity: 0.25,
          }}
        />
      </div>

      {/* ── Scooter Silhouette (center-bottom) ─────────── */}
      <div className="absolute bottom-[10%] left-[15%] w-48 h-32 sm:w-56 sm:h-36">
        {/* Rear wheel */}
        <div
          className="absolute bottom-0 left-[8%] w-12 h-12 sm:w-14 sm:h-14 rounded-full"
          style={{
            border: "3px solid hsl(var(--foreground))",
            opacity: 0.7,
          }}
        />
        {/* Rear wheel hub */}
        <div
          className="absolute bottom-[15px] left-[calc(8%+15px)] sm:bottom-[17px] sm:left-[calc(8%+17px)] w-3 h-3 rounded-full"
          style={{
            background: "hsl(var(--foreground))",
            opacity: 0.4,
          }}
        />

        {/* Front wheel */}
        <div
          className="absolute bottom-0 right-[5%] w-12 h-12 sm:w-14 sm:h-14 rounded-full"
          style={{
            border: "3px solid hsl(var(--foreground))",
            opacity: 0.7,
          }}
        />
        {/* Front wheel hub */}
        <div
          className="absolute bottom-[15px] right-[calc(5%+15px)] sm:bottom-[17px] sm:right-[calc(5%+17px)] w-3 h-3 rounded-full"
          style={{
            background: "hsl(var(--foreground))",
            opacity: 0.4,
          }}
        />

        {/* Scooter body / frame */}
        <div
          className="absolute bottom-[22px] sm:bottom-[26px] left-[18%] right-[15%] h-8 sm:h-9 rounded-lg"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)) 0%, hsla(var(--primary), 0.8) 100%)",
            boxShadow: "0 4px 16px hsla(var(--primary), 0.25)",
          }}
        />

        {/* Seat */}
        <div
          className="absolute bottom-[48px] sm:bottom-[56px] left-[22%] w-14 sm:w-16 h-4 sm:h-5 rounded-t-lg"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--foreground)) 0%, hsla(var(--foreground), 0.7) 100%)",
            opacity: 0.6,
          }}
        />

        {/* Handlebar stem */}
        <div
          className="absolute bottom-[48px] sm:bottom-[56px] right-[18%] w-2 h-14 sm:h-16"
          style={{
            background: "hsl(var(--foreground))",
            opacity: 0.5,
            borderRadius: "4px 4px 0 0",
          }}
        />
        {/* Handlebar */}
        <div
          className="absolute bottom-[84px] sm:bottom-[96px] right-[12%] w-10 sm:w-12 h-2 rounded-full"
          style={{
            background: "hsl(var(--foreground))",
            opacity: 0.5,
          }}
        />

        {/* Headlight */}
        <div
          className="absolute bottom-[38px] sm:bottom-[44px] right-[10%] w-4 h-4 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent)) 30%, hsla(var(--accent), 0.2) 100%)",
            boxShadow: "0 0 12px hsla(var(--accent), 0.4)",
          }}
        />
      </div>

      {/* ── Delivery Bag (on back of scooter) ──────────── */}
      <div
        className="absolute bottom-[42%] left-[12%] w-14 h-16 sm:w-16 sm:h-18 animate-float"
        style={{ animationDelay: "0.5s" }}
      >
        {/* Bag body */}
        <div
          className="w-full h-full rounded-lg"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--primary)) 0%, hsla(var(--primary), 0.85) 100%)",
            boxShadow: "0 6px 20px -4px hsla(var(--primary), 0.3)",
          }}
        />
        {/* Bag flap */}
        <div
          className="absolute top-0 left-0 right-0 h-[30%] rounded-t-lg"
          style={{
            background:
              "linear-gradient(180deg, hsla(var(--primary), 0.95) 0%, hsl(var(--primary)) 100%)",
            borderBottom: "1.5px solid hsla(0, 0%, 100%, 0.15)",
          }}
        />
        {/* Diyafa logo on bag */}
        <div
          className="absolute top-[38%] left-1/2 -translate-x-1/2 w-6 h-3 rounded-sm"
          style={{
            background: "hsla(0, 0%, 100%, 0.25)",
          }}
        />
        {/* Strap */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
          style={{
            background: "hsla(var(--foreground), 0.3)",
          }}
        />
      </div>

      {/* ── Phone Screen (showing earnings) ────────────── */}
      <div
        className="absolute top-[12%] right-[8%] w-24 h-44 sm:w-28 sm:h-48 animate-float"
        style={{ animationDelay: "1.2s" }}
      >
        {/* Phone body */}
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, hsl(228 18% 11%) 0%, hsl(228 22% 8%) 100%)",
            boxShadow:
              "0 8px 32px -8px rgba(0,0,0,0.4), inset 0 1px 0 hsla(0, 0%, 100%, 0.05)",
            border: "2px solid hsla(0, 0%, 100%, 0.08)",
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <div className="w-1 h-1 rounded-full bg-white/30" />
            </div>
            <div className="w-8 h-1 rounded-full bg-white/20" />
            <div className="w-4 h-2 rounded-sm bg-sage/40" />
          </div>

          {/* App header */}
          <div className="px-3 pt-2">
            <div className="w-12 h-1.5 rounded-full bg-primary/40 mb-1" />
            <div className="w-16 h-1 rounded-full bg-white/15" />
          </div>

          {/* Earnings display */}
          <div className="px-3 pt-4 text-center">
            <div className="text-[8px] sm:text-[9px] text-white/30 font-medium mb-1">
              Today
            </div>
            <div
              className="text-lg sm:text-xl font-bold tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              450 MAD
            </div>
            <div className="text-[7px] sm:text-[8px] text-white/25 mt-0.5">
              8 deliveries
            </div>
          </div>

          {/* Mini earnings chart */}
          <div className="px-3 pt-3 flex items-end justify-center gap-[3px] h-10">
            {[40, 65, 50, 80, 55, 70, 90].map((h, i) => (
              <div
                key={i}
                className="rounded-t-sm"
                style={{
                  width: "4px",
                  height: `${h}%`,
                  background:
                    i === 6
                      ? "hsl(var(--primary))"
                      : "hsla(var(--primary), 0.25)",
                  transition: "height 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Order notification */}
          <div className="mx-2 mt-3 rounded-lg bg-white/[0.06] border border-white/[0.08] p-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "hsl(var(--sage))" }}
              />
              <div className="text-[7px] sm:text-[8px] text-white/50 font-medium">
                New order nearby
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-[7px] text-white/30">Cafe Riad · 1.2km</div>
              <div className="text-[7px] font-bold text-primary/80">
                +55 MAD
              </div>
            </div>
          </div>

          {/* Bottom nav bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-2 py-2 border-t border-white/[0.06]">
            <div className="w-4 h-4 rounded-md bg-primary/30" />
            <div className="w-4 h-4 rounded-full bg-white/10" />
            <div className="w-4 h-4 rounded-md bg-white/10" />
          </div>
        </div>
      </div>

      {/* ── Decorative 8-pointed Star (top-left) ──────── */}
      <svg
        className="absolute top-[5%] left-[12%] w-12 h-12 sm:w-14 sm:h-14"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{
          color: "hsl(var(--primary))",
          opacity: 0.12,
          animation: "gentleRotate 8s ease-in-out infinite",
        }}
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>

      {/* Small accent star (bottom-right) */}
      <svg
        className="absolute bottom-[30%] right-[5%] w-7 h-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{
          color: "hsl(var(--accent))",
          opacity: 0.1,
          animation: "gentleRotate 6s ease-in-out infinite reverse",
        }}
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>

      {/* ── Ambient glow ───────────────────────────────── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="absolute bottom-[20%] right-[15%] w-32 h-32 rounded-full bg-accent/[0.04] blur-3xl" />
    </div>
  );
};
