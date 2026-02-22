"use client";

import {
  Check,
  ImageIcon,
  QrCode,
  Star,
  TrendingUp,
  BarChart3,
  Utensils,
} from "lucide-react";

export const HeroMockup = () => {
  return (
    <div className="relative">
      {/* Ambient glow behind mockup */}
      <div
        className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-ember/10 via-transparent to-gold/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-sm">
        {/* Browser chrome */}
        <div
          className="flex items-center gap-1.5 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]"
          aria-hidden="true"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <div className="ml-3 flex-1 h-5 rounded-md bg-white/[0.06] max-w-[200px] flex items-center px-2">
            <span className="text-[9px] text-white/30 font-mono">
              feastqr.com/dashboard
            </span>
          </div>
        </div>

        {/* Dashboard content area */}
        <div className="relative min-h-[300px] sm:min-h-[360px] p-4 sm:p-5 overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
          {/* Sidebar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-11 sm:w-14 bg-white/[0.03] border-r border-white/[0.06] flex flex-col items-center gap-3 pt-5"
            aria-hidden="true"
          >
            <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Utensils className="h-3 w-3 text-primary/60" />
            </div>
            <div className="h-6 w-6 rounded-md bg-white/[0.06] flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-white/20" />
            </div>
            <div className="h-6 w-6 rounded-md bg-white/[0.06] flex items-center justify-center">
              <QrCode className="h-3 w-3 text-white/20" />
            </div>
            <div className="h-6 w-6 rounded-md bg-white/[0.06]" />
          </div>

          {/* Main content */}
          <div className="ml-13 sm:ml-16 relative">
            {/* Restaurant header */}
            <div className="mockup-fade-in flex items-center gap-3 mb-5">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary/70" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-28 sm:w-36 rounded-full bg-white/40" />
                <div className="h-2 w-20 sm:w-24 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Stats row */}
            <div className="mockup-slide-in-1 grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5 sm:p-3 transition-colors hover:bg-white/[0.06]">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-sage/60" />
                  <span className="text-[9px] text-white/30">Orders</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-white/80">
                  247
                </span>
                <div className="mt-1.5 flex gap-[2px]">
                  {[40, 55, 35, 65, 50, 75, 60].map((h, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-sage/30"
                      style={{ height: `${h * 0.18}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5 sm:p-3 transition-colors hover:bg-white/[0.06]">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-3 w-3 text-gold/60" />
                  <span className="text-[9px] text-white/30">Rating</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-white/80">
                  4.8
                </span>
                <div className="mt-1.5 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2 w-2 ${i < 4 ? "fill-gold/60 text-gold/60" : "fill-gold/20 text-gold/20"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5 sm:p-3 transition-colors hover:bg-white/[0.06]">
                <div className="flex items-center gap-1 mb-1">
                  <div className="h-3 w-3 rounded-full bg-primary/30" />
                  <span className="text-[9px] text-white/30">Revenue</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-emerald-400/80">
                  12.4K
                </span>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-2 w-2 text-emerald-400/50" />
                  <span className="text-[8px] text-emerald-400/50">+18%</span>
                </div>
              </div>
            </div>

            {/* Dish cards */}
            <div className="space-y-2">
              {/* Dish card 1 — featured */}
              <div className="mockup-slide-in-2 flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-2.5 sm:p-3 transition-all duration-200 hover:bg-primary/[0.07]">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary/50" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-white/60">
                    Lamb Tagine
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    <Star className="h-3 w-3 fill-gold/40 text-gold/40" />
                  </div>
                </div>
                <div className="h-6 px-3 rounded-full bg-primary/15 flex items-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-primary/80">
                    85 MAD
                  </span>
                </div>
              </div>

              {/* Dish card 2 */}
              <div className="mockup-slide-in-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3 transition-all duration-200 hover:bg-white/[0.04]">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sage/40" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-white/50">
                    Couscous Royal
                  </span>
                  <div className="h-2 w-14 sm:w-16 rounded-full bg-white/10" />
                </div>
                <div className="h-6 px-3 rounded-full bg-white/[0.06] flex items-center flex-shrink-0">
                  <span className="text-[10px] font-medium text-white/40">
                    65 MAD
                  </span>
                </div>
              </div>
            </div>

            {/* QR code badge — bottom right */}
            <div
              className="mockup-qr-appear absolute -bottom-1 right-0 sm:bottom-0 sm:right-1 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10"
              aria-hidden="true"
            >
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>

            {/* Published badge */}
            <div
              className="mockup-published absolute -top-1 right-0 sm:right-1 flex items-center gap-1.5 rounded-full bg-sage/10 border border-sage/20 px-3 py-1 shadow-sm"
              aria-hidden="true"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-sage animate-pulse" />
              <Check className="h-3 w-3 text-sage" />
              <span className="text-[10px] sm:text-xs font-semibold text-sage">
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification — bottom-left of mockup */}
      <div
        className="absolute -left-6 bottom-16 hidden animate-float rounded-xl glass-dark px-3.5 py-2.5 shadow-xl sm:block"
        style={{ animationDelay: "2s" }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sage/15">
            <Check className="h-3.5 w-3.5 text-sage" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/70">
              New Order!
            </p>
            <p className="text-[9px] text-white/35">
              Table 3 &middot; 150 MAD
            </p>
          </div>
        </div>
      </div>

      {/* Floating rating badge — top-right */}
      <div
        className="absolute -right-4 top-12 hidden animate-float rounded-lg glass-dark px-2.5 py-1.5 shadow-xl sm:block"
        style={{ animationDelay: "3.5s" }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-gold text-gold" />
          <span className="text-[10px] font-bold text-white/60">4.8</span>
        </div>
      </div>
    </div>
  );
};
