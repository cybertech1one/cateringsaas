"use client";

/* Moroccan Riad Archway — culturally authentic SVG hero illustration
   Features: Moorish horseshoe arch, zellige tile border, tagine feast scene,
   Arabic calligraphy "ضيافة", floating badges, animated steam & stars */

export const HeroIllustration = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div
        className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-[#E84D25]/10 via-transparent to-[#D9A44D]/10 blur-2xl"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 600 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-auto"
        role="img"
        aria-label="Moroccan riad archway illustration with tagine feast, mint tea, and Arabic calligraphy for Diyafa catering"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="riad-arch-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E4D92" />
            <stop offset="100%" stopColor="#162F5A" />
          </linearGradient>
          <linearGradient id="riad-inner-glow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#FFF8F0" />
            <stop offset="40%" stopColor="#FCECD2" />
            <stop offset="100%" stopColor="#D9A44D" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="riad-tagine-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4845A" />
            <stop offset="100%" stopColor="#A0522D" />
          </linearGradient>
          <linearGradient id="riad-tagine-lid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A44E" />
            <stop offset="100%" stopColor="#C2703E" />
          </linearGradient>
          <linearGradient id="riad-tea-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#DAA520" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="riad-tea-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B7355" />
            <stop offset="100%" stopColor="#6B4226" />
          </linearGradient>
          <linearGradient id="riad-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAFAFA" />
            <stop offset="100%" stopColor="#E8E0D0" />
          </linearGradient>
          <linearGradient id="riad-table" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5E3C" />
            <stop offset="100%" stopColor="#6B4226" />
          </linearGradient>
          <radialGradient id="riad-warm-glow" cx="0.5" cy="0.6" r="0.5">
            <stop offset="0%" stopColor="#FFE4B5" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFF8F0" stopOpacity="0" />
          </radialGradient>

          {/* Filters */}
          <filter id="riad-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.15" />
          </filter>
          <filter id="riad-shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.1" />
          </filter>
          <filter id="riad-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>

          {/* Clip path for inner arch content */}
          <clipPath id="riad-arch-clip">
            <path d="M190 440 L190 220 Q190 120 300 120 Q410 120 410 220 L410 440 Z" />
          </clipPath>

          {/* Zellige tile pattern */}
          <pattern id="zellige" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            {/* 8-pointed star motif */}
            <path
              d="M12 0 L14.5 4.5 L19 2 L16.5 7 L24 7 L18 10 L21 14.5 L16 12.5 L16 18 L12 13.5 L8 18 L8 12.5 L3 14.5 L6 10 L0 7 L7.5 7 L5 2 L9.5 4.5 Z"
              fill="#D9A44D"
              opacity="0.12"
            />
            <circle cx="12" cy="12" r="1.5" fill="#D9A44D" opacity="0.08" />
          </pattern>

          {/* Smaller zellige for arch border */}
          <pattern id="zellige-sm" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="none" />
            <path
              d="M8 0 L10 3 L13 1.5 L11 5 L16 5 L12.5 7 L14.5 10 L11 8.5 L11 12 L8 9 L5 12 L5 8.5 L1.5 10 L3.5 7 L0 5 L5 5 L3 1.5 L6 3 Z"
              fill="#D9A44D"
              opacity="0.18"
            />
          </pattern>
        </defs>

        {/* ============================================= */}
        {/* Background breathing circles                  */}
        {/* ============================================= */}
        <circle cx="500" cy="80" r="100" fill="#C2703E" opacity="0.04">
          <animate attributeName="r" values="100;112;100" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="420" r="80" fill="#4A9A6E" opacity="0.04">
          <animate attributeName="r" values="80;92;80" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="540" cy="400" r="55" fill="#D9A44D" opacity="0.05">
          <animate attributeName="r" values="55;64;55" dur="3.5s" repeatCount="indefinite" />
        </circle>

        {/* ============================================= */}
        {/* Zellige background pattern (very subtle)      */}
        {/* ============================================= */}
        <rect x="140" y="40" width="320" height="460" rx="8" fill="url(#zellige)" opacity="0.4" />

        {/* ============================================= */}
        {/* MOORISH HORSESHOE ARCH — Main frame           */}
        {/* ============================================= */}
        <g filter="url(#riad-shadow)">
          {/* Outer arch border — deep blue */}
          <path
            d="M160 480 L160 230 Q160 90 300 90 Q440 90 440 230 L440 480 Z"
            fill="url(#riad-arch-fill)"
          />

          {/* Zellige pattern overlay on arch border */}
          <path
            d="M160 480 L160 230 Q160 90 300 90 Q440 90 440 230 L440 480 Z"
            fill="url(#zellige-sm)"
          />

          {/* Inner arch cutout — terracotta frame ring */}
          <path
            d="M180 470 L180 225 Q180 110 300 110 Q420 110 420 225 L420 470 Z"
            fill="#C2703E"
          />

          {/* Inner arch opening — warm cream interior */}
          <path
            d="M190 465 L190 222 Q190 120 300 120 Q410 120 410 222 L410 465 Z"
            fill="url(#riad-inner-glow)"
          />
        </g>

        {/* ============================================= */}
        {/* Arch decorative details                       */}
        {/* ============================================= */}

        {/* Terracotta frame scalloped/geometric inlay lines */}
        <path
          d="M184 460 L184 224 Q184 114 300 114 Q416 114 416 224 L416 460"
          fill="none"
          stroke="#D9A44D"
          strokeWidth="1"
          strokeOpacity="0.5"
          strokeDasharray="4 3"
        />

        {/* Inner decorative line */}
        <path
          d="M196 460 L196 224 Q196 128 300 128 Q404 128 404 224 L404 460"
          fill="none"
          stroke="#C2703E"
          strokeWidth="0.6"
          strokeOpacity="0.3"
        />

        {/* Keystone diamond at arch apex */}
        <g transform="translate(300, 96)">
          <path d="M0 -10 L8 0 L0 10 L-8 0 Z" fill="#D9A44D" opacity="0.7" />
          <path d="M0 -6 L5 0 L0 6 L-5 0 Z" fill="#FFF8F0" opacity="0.6" />
        </g>

        {/* Small diamond accents along arch curve — left side */}
        <g opacity="0.4">
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(176, 300)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(172, 250)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(182, 200)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(200, 160)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(230, 130)" />
        </g>
        {/* Right side */}
        <g opacity="0.4">
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(424, 300)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(428, 250)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(418, 200)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(400, 160)" />
          <path d="M0 -4 L3 0 L0 4 L-3 0 Z" fill="#D9A44D" transform="translate(370, 130)" />
        </g>

        {/* Column bases at bottom of arch */}
        <rect x="160" y="460" width="24" height="20" rx="2" fill="#1E4D92" />
        <rect x="416" y="460" width="24" height="20" rx="2" fill="#1E4D92" />
        <rect x="162" y="462" width="20" height="4" rx="1" fill="#D9A44D" opacity="0.4" />
        <rect x="418" y="462" width="20" height="4" rx="1" fill="#D9A44D" opacity="0.4" />

        {/* ============================================= */}
        {/* Arabic Calligraphy — "ضيافة" (Diyafa)         */}
        {/* ============================================= */}
        <g transform="translate(300, 152)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fontFamily="'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', serif"
            fontSize="30"
            fontWeight="700"
            fill="#1E4D92"
            opacity="0.85"
            direction="rtl"
          >
            ضيافة
          </text>
          {/* Decorative line under calligraphy */}
          <line x1="-40" y1="10" x2="40" y2="10" stroke="#D9A44D" strokeWidth="1" opacity="0.5" />
          <circle cx="-44" cy="10" r="2" fill="#D9A44D" opacity="0.4" />
          <circle cx="44" cy="10" r="2" fill="#D9A44D" opacity="0.4" />
          <circle cx="0" cy="10" r="1.5" fill="#D9A44D" opacity="0.3" />
        </g>

        {/* ============================================= */}
        {/* FEAST SCENE inside the arch                   */}
        {/* ============================================= */}
        <g clipPath="url(#riad-arch-clip)">
          {/* Warm ambient glow */}
          <circle cx="300" cy="340" r="120" fill="url(#riad-warm-glow)" />

          {/* Wooden table surface */}
          <ellipse cx="300" cy="410" rx="105" ry="22" fill="url(#riad-table)" opacity="0.35" />
          <ellipse cx="300" cy="408" rx="100" ry="18" fill="#8B5E3C" opacity="0.15" />

          {/* ---- TAGINE (center) ---- */}
          <g transform="translate(300, 340)">
            {/* Base shadow */}
            <ellipse cx="0" cy="40" rx="52" ry="12" fill="#6B4226" opacity="0.15" />

            {/* Tagine base/bowl */}
            <ellipse cx="0" cy="30" rx="48" ry="16" fill="url(#riad-tagine-body)" />

            {/* Food inside base */}
            <ellipse cx="0" cy="26" rx="38" ry="11" fill="#8B6914" opacity="0.35" />
            <circle cx="-12" cy="24" r="5" fill="#D9A44D" opacity="0.5" />
            <circle cx="8" cy="22" r="4.5" fill="#E84D25" opacity="0.4" />
            <circle cx="-3" cy="20" r="4" fill="#4A9A6E" opacity="0.45" />
            <circle cx="16" cy="26" r="3" fill="#D9A44D" opacity="0.4" />
            <circle cx="-18" cy="28" r="3" fill="#C2703E" opacity="0.35" />

            {/* Conical lid */}
            <path d="M-42 28 Q0 -50 42 28" fill="url(#riad-tagine-lid)" />
            <path d="M-42 28 Q0 -50 42 28" fill="none" stroke="#B8860B" strokeWidth="0.5" opacity="0.3" />

            {/* Decorative lines on lid */}
            <path d="M-30 18 Q0 -30 30 18" fill="none" stroke="#B8860B" strokeWidth="0.7" opacity="0.15" />
            <path d="M-20 8 Q0 -18 20 8" fill="none" stroke="#B8860B" strokeWidth="0.5" opacity="0.12" />

            {/* Lid knob */}
            <circle cx="0" cy="-42" r="6" fill="#C2703E" />
            <circle cx="0" cy="-42" r="3.5" fill="#E8A44E" />

            {/* Steam wisps */}
            <path d="M-8 -50 Q-12 -64 -6 -76" stroke="#999" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.25">
              <animate
                attributeName="d"
                values="M-8 -50 Q-12 -64 -6 -76;M-8 -50 Q-4 -66 -10 -80;M-8 -50 Q-12 -64 -6 -76"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.25;0.08;0.25" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M6 -50 Q10 -62 4 -72" stroke="#999" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.2">
              <animate
                attributeName="d"
                values="M6 -50 Q10 -62 4 -72;M6 -50 Q2 -64 8 -76;M6 -50 Q10 -62 4 -72"
                dur="3.5s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.2;0.06;0.2" dur="3.5s" repeatCount="indefinite" />
            </path>
            <path d="M0 -50 Q-2 -58 2 -68" stroke="#999" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.18">
              <animate
                attributeName="d"
                values="M0 -50 Q-2 -58 2 -68;M0 -50 Q3 -60 -1 -70;M0 -50 Q-2 -58 2 -68"
                dur="2.8s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.18;0.05;0.18" dur="2.8s" repeatCount="indefinite" />
            </path>
          </g>

          {/* ---- MINT TEA GLASSES (left of tagine) ---- */}
          <g transform="translate(228, 370)">
            {/* Glass shadow */}
            <ellipse cx="0" cy="28" rx="14" ry="4" fill="#5A4A3A" opacity="0.1" />

            {/* Glass body — tapered trapezoid */}
            <path d="M-10 0 L-8 24 L8 24 L10 0 Z" fill="url(#riad-tea-glass)" stroke="#D9A44D" strokeWidth="0.6" strokeOpacity="0.35" />

            {/* Tea liquid */}
            <path d="M-8.5 8 L-7.5 22 L7.5 22 L8.5 8 Z" fill="url(#riad-tea-liquid)" opacity="0.6" />

            {/* Gold decorative bands */}
            <line x1="-9.5" y1="4" x2="9.5" y2="4" stroke="#D9A44D" strokeWidth="0.8" opacity="0.4" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#D9A44D" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />

            {/* Mint sprig */}
            <g transform="translate(-2, -4) rotate(-10)">
              <ellipse rx="5" ry="2.5" fill="#4A9A6E" opacity="0.8" />
              <ellipse rx="3.5" ry="1.8" cx="4" cy="-2" fill="#4A9A6E" opacity="0.6" />
              <line x1="0" y1="2.5" x2="0" y2="6" stroke="#3D8B5E" strokeWidth="0.5" />
            </g>
          </g>

          {/* Second tea glass (slightly behind) */}
          <g transform="translate(248, 378)" opacity="0.7">
            <path d="M-8 0 L-6.5 20 L6.5 20 L8 0 Z" fill="url(#riad-tea-glass)" stroke="#D9A44D" strokeWidth="0.5" strokeOpacity="0.3" />
            <path d="M-7 6 L-6 18 L6 18 L7 6 Z" fill="url(#riad-tea-liquid)" opacity="0.5" />
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#D9A44D" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
          </g>

          {/* ---- DECORATIVE PLATE (right of tagine) ---- */}
          <g transform="translate(370, 380)">
            {/* Plate shadow */}
            <ellipse cx="0" cy="18" rx="36" ry="8" fill="#6B4226" opacity="0.1" />

            {/* Plate body */}
            <ellipse cx="0" cy="8" rx="36" ry="14" fill="url(#riad-plate)" />
            <ellipse cx="0" cy="6" rx="32" ry="12" fill="#FAFAFA" stroke="#D9A44D" strokeWidth="0.5" strokeOpacity="0.3" />

            {/* Plate decorative rim */}
            <ellipse cx="0" cy="6" rx="30" ry="11" fill="none" stroke="#C2703E" strokeWidth="0.4" opacity="0.25" strokeDasharray="3 2" />

            {/* Food on plate — colorful pastilla/briouates */}
            <ellipse cx="0" cy="2" rx="22" ry="8" fill="#F5DEB3" opacity="0.7" />
            <circle cx="-10" cy="0" r="5" fill="#D9A44D" opacity="0.5" />
            <circle cx="6" cy="-2" r="4.5" fill="#E84D25" opacity="0.4" />
            <circle cx="-2" cy="2" r="3.5" fill="#4A9A6E" opacity="0.45" />
            <circle cx="14" cy="2" r="3" fill="#C2703E" opacity="0.35" />
            <circle cx="-14" cy="4" r="2.5" fill="#D9A44D" opacity="0.3" />
            {/* Powdered sugar / icing sugar dusting */}
            <circle cx="-6" cy="-3" r="1" fill="white" opacity="0.5" />
            <circle cx="2" cy="-4" r="0.8" fill="white" opacity="0.4" />
            <circle cx="10" cy="-1" r="1" fill="white" opacity="0.45" />
          </g>

          {/* ---- Small decorative couscous bowl (far right, subtle) ---- */}
          <g transform="translate(350, 400)" opacity="0.5">
            <ellipse cx="0" cy="8" rx="16" ry="6" fill="url(#riad-plate)" />
            <ellipse cx="0" cy="4" rx="12" ry="5" fill="#F5DEB3" />
            <circle cx="-4" cy="2" r="2" fill="#D9A44D" opacity="0.4" />
            <circle cx="4" cy="3" r="1.5" fill="#4A9A6E" opacity="0.35" />
          </g>

          {/* ---- Tiled floor pattern (bottom of arch) ---- */}
          <g opacity="0.08">
            <rect x="190" y="430" width="220" height="35" fill="url(#zellige-sm)" />
          </g>
        </g>

        {/* ============================================= */}
        {/* FLOATING BADGES                               */}
        {/* ============================================= */}

        {/* Star ratings badge — top left */}
        <g filter="url(#riad-shadow-sm)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 3,-5; 0,0"
            dur="3s"
            repeatCount="indefinite"
          />
          <g transform="translate(60, 120)">
            <rect x="-8" y="-10" width="68" height="30" rx="15" fill="white" stroke="#D9A44D" strokeWidth="0.6" strokeOpacity="0.3" />
            {/* 5 stars */}
            {[0, 1, 2, 3, 4].map((i) => (
              <polygon
                key={`star-${i}`}
                points="5,0 6.5,3.5 10,3.5 7.2,5.8 8.3,9.5 5,7 1.7,9.5 2.8,5.8 0,3.5 3.5,3.5"
                fill="#D9A44D"
                transform={`translate(${i * 11 - 4}, -5) scale(0.65)`}
              />
            ))}
            <text x="42" y="4" fontSize="8" fontWeight="600" fill="#1A1B2E" fontFamily="system-ui" opacity="0.6">
              4.9
            </text>
          </g>
        </g>

        {/* "200 Guests" badge — top right */}
        <g filter="url(#riad-shadow-sm)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -4,-6; 0,0"
            dur="4s"
            repeatCount="indefinite"
          />
          <g transform="translate(480, 160)">
            <rect x="-10" y="-12" width="80" height="34" rx="17" fill="white" stroke="#4A9A6E" strokeWidth="0.6" strokeOpacity="0.25" />
            {/* People icon */}
            <circle cx="4" cy="-1" r="4" fill="none" stroke="#4A9A6E" strokeWidth="1.2" />
            <path d="M-4 10 Q4 4 12 10" fill="none" stroke="#4A9A6E" strokeWidth="1.2" />
            <text x="18" y="5" fontSize="9" fontWeight="700" fill="#1A1B2E" fontFamily="system-ui">
              200
            </text>
            <text x="42" y="5" fontSize="7" fill="#888" fontFamily="system-ui">
              Guests
            </text>
          </g>
        </g>

        {/* "45K MAD" price badge — bottom right */}
        <g filter="url(#riad-shadow-sm)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 5,-4; 0,0"
            dur="3.8s"
            repeatCount="indefinite"
          />
          <g transform="translate(470, 340)">
            <rect x="-10" y="-12" width="82" height="34" rx="17" fill="white" stroke="#E84D25" strokeWidth="0.6" strokeOpacity="0.25" />
            {/* Price tag icon */}
            <path
              d="M4 -2 L10 -2 L14 2 L10 6 L4 6 Z"
              fill="none"
              stroke="#E84D25"
              strokeWidth="1"
            />
            <circle cx="7" cy="2" r="1" fill="#E84D25" />
            <text x="18" y="5" fontSize="10" fontWeight="700" fill="#E84D25" fontFamily="system-ui">
              45K
            </text>
            <text x="46" y="5" fontSize="7" fill="#888" fontFamily="system-ui">
              MAD
            </text>
          </g>
        </g>

        {/* ============================================= */}
        {/* DECORATIVE 8-POINTED STARS (Moroccan motif)   */}
        {/* ============================================= */}

        {/* 8-pointed star shape: two overlapping rotated squares */}
        {/* Star 1 — top left area */}
        <g opacity="0.25" transform="translate(95, 200)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="95,200; 92,196; 95,200"
            dur="4.2s"
            repeatCount="indefinite"
          />
          <rect x="-5" y="-5" width="10" height="10" fill="#D9A44D" transform="rotate(0)" />
          <rect x="-5" y="-5" width="10" height="10" fill="#D9A44D" transform="rotate(45)" />
        </g>

        {/* Star 2 — bottom right */}
        <g opacity="0.2" transform="translate(520, 280)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="520,280; 523,276; 520,280"
            dur="3.6s"
            repeatCount="indefinite"
          />
          <rect x="-4" y="-4" width="8" height="8" fill="#C2703E" transform="rotate(0)" />
          <rect x="-4" y="-4" width="8" height="8" fill="#C2703E" transform="rotate(45)" />
        </g>

        {/* Star 3 — left mid */}
        <g opacity="0.18" transform="translate(70, 330)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="70,330; 67,326; 70,330"
            dur="5s"
            repeatCount="indefinite"
          />
          <rect x="-3.5" y="-3.5" width="7" height="7" fill="#1E4D92" transform="rotate(0)" />
          <rect x="-3.5" y="-3.5" width="7" height="7" fill="#1E4D92" transform="rotate(45)" />
        </g>

        {/* Star 4 — top right */}
        <g opacity="0.15" transform="translate(540, 120)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="540,120; 543,116; 540,120"
            dur="4.8s"
            repeatCount="indefinite"
          />
          <rect x="-3" y="-3" width="6" height="6" fill="#E84D25" transform="rotate(0)" />
          <rect x="-3" y="-3" width="6" height="6" fill="#E84D25" transform="rotate(45)" />
        </g>

        {/* Star 5 — bottom left */}
        <g opacity="0.2" transform="translate(110, 460)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="110,460; 107,457; 110,460"
            dur="3.4s"
            repeatCount="indefinite"
          />
          <rect x="-4" y="-4" width="8" height="8" fill="#4A9A6E" transform="rotate(0)" />
          <rect x="-4" y="-4" width="8" height="8" fill="#4A9A6E" transform="rotate(45)" />
        </g>

        {/* Star 6 — far right */}
        <g opacity="0.15" transform="translate(560, 440)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="560,440; 557,436; 560,440"
            dur="4.5s"
            repeatCount="indefinite"
          />
          <rect x="-3" y="-3" width="6" height="6" fill="#D9A44D" transform="rotate(0)" />
          <rect x="-3" y="-3" width="6" height="6" fill="#D9A44D" transform="rotate(45)" />
        </g>

        {/* ============================================= */}
        {/* Floating zellige tiles                        */}
        {/* ============================================= */}

        {/* Tile 1 — small diamond */}
        <g opacity="0.12">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -2,-5; 0,0"
            dur="5.5s"
            repeatCount="indefinite"
          />
          <path d="M0 -8 L6 0 L0 8 L-6 0 Z" fill="#1E4D92" transform="translate(540, 200)" />
        </g>

        {/* Tile 2 */}
        <g opacity="0.1">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 3,-4; 0,0"
            dur="4.8s"
            repeatCount="indefinite"
          />
          <path d="M0 -6 L5 0 L0 6 L-5 0 Z" fill="#C2703E" transform="translate(50, 260)" />
        </g>

        {/* Tile 3 */}
        <g opacity="0.1">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -3,-3; 0,0"
            dur="6s"
            repeatCount="indefinite"
          />
          <path d="M0 -5 L4 0 L0 5 L-4 0 Z" fill="#D9A44D" transform="translate(560, 360)" />
        </g>

        {/* ============================================= */}
        {/* Decorative dots (ambient)                     */}
        {/* ============================================= */}
        <circle cx="50" cy="180" r="2.5" fill="#E84D25" opacity="0.12" />
        <circle cx="560" cy="160" r="3" fill="#4A9A6E" opacity="0.1" />
        <circle cx="40" cy="400" r="2" fill="#D9A44D" opacity="0.12" />
        <circle cx="570" cy="460" r="2.5" fill="#C2703E" opacity="0.1" />
        <circle cx="130" cy="500" r="3" fill="#1E4D92" opacity="0.08" />
        <circle cx="500" cy="480" r="2" fill="#E84D25" opacity="0.08" />
      </svg>
    </div>
  );
};
