"use client";

/* Animated hero SVG: phone with menu, QR code scan, Moroccan food, delivery, ratings */
const S = "5,0 6.5,3.5 10,3.5 7.2,5.8 8.3,9.5 5,7 1.7,9.5 2.8,5.8 0,3.5 3.5,3.5"; // star path

export const HeroIllustration = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-[#E84D25]/10 via-transparent to-[#D4A017]/10 blur-2xl" aria-hidden="true" />
      <svg viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-auto" role="img" aria-label="FeastQR platform illustration with phone menu, QR code, and Moroccan food">
        <defs>
          <linearGradient id="h-ember" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E84D25" /><stop offset="100%" stopColor="#D4A017" /></linearGradient>
          <linearGradient id="h-phone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A1B2E" /><stop offset="100%" stopColor="#12131F" /></linearGradient>
          <linearGradient id="h-screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFDF8" /><stop offset="100%" stopColor="#FFF8ED" /></linearGradient>
          <linearGradient id="h-tagine" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#CD7F32" /><stop offset="100%" stopColor="#A0522D" /></linearGradient>
          <linearGradient id="h-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8A44E" /><stop offset="100%" stopColor="#CD7F32" /></linearGradient>
          <linearGradient id="h-tea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFD700" stopOpacity="0.15" /><stop offset="100%" stopColor="#DAA520" stopOpacity="0.3" /></linearGradient>
          <linearGradient id="h-liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B7355" /><stop offset="100%" stopColor="#6B5B3E" /></linearGradient>
          <linearGradient id="h-bowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FAFAFA" /><stop offset="100%" stopColor="#E8E8E8" /></linearGradient>
          <linearGradient id="h-qr" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFF" /><stop offset="100%" stopColor="#FFF8ED" /></linearGradient>
          <filter id="fs" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.12" /></filter>
          <filter id="fss" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.08" /></filter>
          <clipPath id="sc"><rect x="205" y="72" width="190" height="368" rx="4" /></clipPath>
        </defs>

        {/* Background breathing circles */}
        <circle cx="480" cy="100" r="120" fill="#E84D25" opacity="0.04"><animate attributeName="r" values="120;130;120" dur="4s" repeatCount="indefinite" /></circle>
        <circle cx="100" cy="400" r="90" fill="#4A9A6E" opacity="0.04"><animate attributeName="r" values="90;100;90" dur="5s" repeatCount="indefinite" /></circle>
        <circle cx="520" cy="380" r="60" fill="#D4A017" opacity="0.05"><animate attributeName="r" values="60;68;60" dur="3.5s" repeatCount="indefinite" /></circle>

        {/* Phone device */}
        <g filter="url(#fs)">
          <rect x="192" y="40" width="216" height="420" rx="28" fill="url(#h-phone)" />
          <rect x="196" y="44" width="208" height="412" rx="25" fill="#1E1F35" />
          <rect x="205" y="72" width="190" height="368" rx="4" fill="url(#h-screen)" />
        </g>
        <rect x="262" y="44" width="76" height="22" rx="11" fill="#1A1B2E" />
        <circle cx="300" cy="55" r="4" fill="#2A2B45" />

        {/* Screen content */}
        <g clipPath="url(#sc)">
          <text x="218" y="90" fontSize="9" fontWeight="600" fill="#999" fontFamily="system-ui">9:41</text>
          {/* Restaurant header */}
          <rect x="218" y="100" width="32" height="32" rx="8" fill="#E84D25" opacity="0.12" />
          <g transform="translate(226,108)"><path d="M4 1v6M4 10v5M1 4h6M10 1c0 0 0 4 3 6l-1.5 1.5L10 10v5" stroke="#E84D25" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>
          <text x="258" y="113" fontSize="11" fontWeight="700" fill="#1A1B2E" fontFamily="system-ui">Riad Al Baraka</text>
          <g transform="translate(258,120)">
            {[0,1,2,3,4].map(i => <polygon key={i} points={S} fill="#D4A017" transform={`translate(${i*12},0) scale(0.7)`} />)}
            <text x="46" y="7" fontSize="8" fill="#999" fontFamily="system-ui">4.8</text>
          </g>
          {/* Category pills */}
          <rect x="218" y="140" width="36" height="20" rx="10" fill="#E84D25" />
          <text x="226" y="154" fontSize="8" fontWeight="600" fill="white" fontFamily="system-ui">All</text>
          <rect x="260" y="140" width="52" height="20" rx="10" fill="#F5F0E8" />
          <text x="268" y="154" fontSize="8" fill="#888" fontFamily="system-ui">Tagines</text>
          <rect x="318" y="140" width="42" height="20" rx="10" fill="#F5F0E8" />
          <text x="326" y="154" fontSize="8" fill="#888" fontFamily="system-ui">Grills</text>
          {/* Dish 1 */}
          <rect x="218" y="170" width="164" height="100" rx="12" fill="white" stroke="#F0E8D8" strokeWidth="0.5" />
          <rect x="218" y="170" width="164" height="56" rx="12" fill="#FFF0D4" />
          <rect x="218" y="200" width="164" height="26" fill="#FFF0D4" />
          <circle cx="260" cy="195" r="8" fill="#E8A44E" opacity="0.5" /><circle cx="290" cy="190" r="6" fill="#CD7F32" opacity="0.4" />
          <circle cx="320" cy="198" r="7" fill="#D4A017" opacity="0.35" /><circle cx="350" cy="192" r="5" fill="#A0522D" opacity="0.3" />
          <rect x="342" y="175" width="36" height="18" rx="9" fill="white" opacity="0.92" />
          <text x="348" y="188" fontSize="8" fontWeight="700" fill="#E84D25" fontFamily="system-ui">85 MAD</text>
          <text x="226" y="242" fontSize="10" fontWeight="700" fill="#1A1B2E" fontFamily="system-ui">Lamb Tagine</text>
          <text x="226" y="254" fontSize="7.5" fill="#999" fontFamily="system-ui">Slow-cooked with prunes</text>
          <g transform="translate(226,258)">{[0,1,2,3].map(i => <polygon key={i} points="4,0 5.2,2.8 8,2.8 5.8,4.6 6.6,7.5 4,5.6 1.4,7.5 2.2,4.6 0,2.8 2.8,2.8" fill="#D4A017" transform={`translate(${i*9},0) scale(0.55)`} />)}</g>
          {/* Dish 2 */}
          <g opacity="0.9">
            <rect x="218" y="278" width="164" height="78" rx="12" fill="white" stroke="#F0E8D8" strokeWidth="0.5" />
            <rect x="218" y="278" width="164" height="40" rx="12" fill="#E8F5E9" /><rect x="218" y="298" width="164" height="20" fill="#E8F5E9" />
            <circle cx="265" cy="296" r="6" fill="#4A9A6E" opacity="0.3" /><circle cx="300" cy="293" r="5" fill="#4A9A6E" opacity="0.2" /><circle cx="330" cy="298" r="7" fill="#4A9A6E" opacity="0.25" />
            <rect x="342" y="283" width="36" height="18" rx="9" fill="white" opacity="0.92" />
            <text x="348" y="296" fontSize="8" fontWeight="700" fill="#E84D25" fontFamily="system-ui">65 MAD</text>
            <text x="226" y="332" fontSize="10" fontWeight="700" fill="#1A1B2E" fontFamily="system-ui">Couscous Royal</text>
            <text x="226" y="344" fontSize="7.5" fill="#999" fontFamily="system-ui">Seven vegetables &amp; chicken</text>
          </g>
          {/* Cart */}
          <rect x="218" y="370" width="164" height="36" rx="18" fill="#E84D25" />
          <text x="258" y="392" fontSize="9" fontWeight="700" fill="white" fontFamily="system-ui">View Cart - 150 MAD</text>
          <g transform="translate(234,381)"><path d="M0 0h2l1.5 7h8l1.5-5H4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx="5" cy="9" r="1" fill="white" /><circle cx="10" cy="9" r="1" fill="white" /></g>
          <rect x="272" y="418" width="56" height="4" rx="2" fill="#DDD" />
        </g>

        {/* QR code card - floating */}
        <g filter="url(#fss)">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="4s" repeatCount="indefinite" />
          <rect x="430" y="60" width="80" height="80" rx="16" fill="url(#h-qr)" />
          <rect x="430" y="60" width="80" height="80" rx="16" stroke="#E84D25" strokeWidth="1" strokeOpacity="0.15" fill="none" />
          <g transform="translate(445,75)">
            {/* QR corner markers */}
            <rect width="14" height="14" rx="2" fill="#1A1B2E" /><rect x="2" y="2" width="10" height="10" rx="1" fill="white" /><rect x="4" y="4" width="6" height="6" rx="1" fill="#1A1B2E" />
            <rect x="36" width="14" height="14" rx="2" fill="#1A1B2E" /><rect x="38" y="2" width="10" height="10" rx="1" fill="white" /><rect x="40" y="4" width="6" height="6" rx="1" fill="#1A1B2E" />
            <rect y="36" width="14" height="14" rx="2" fill="#1A1B2E" /><rect x="2" y="38" width="10" height="10" rx="1" fill="white" /><rect x="4" y="40" width="6" height="6" rx="1" fill="#1A1B2E" />
            {/* QR data cells - alternating dark/ember for brand feel */}
            {[[18,4],[30,4],[24,10],[18,18],[30,18],[44,18],[10,24],[30,24],[44,24],[4,30],[18,30],[36,30],[24,36],[36,36],[18,44],[44,44]].map(([x,y],i) =>
              <rect key={`d${i}`} x={x} y={y} width="4" height="4" rx="0.5" fill="#1A1B2E" />
            )}
            {[[24,4],[18,10],[30,10],[10,18],[24,18],[36,18],[4,24],[18,24],[36,24],[24,30],[18,36],[30,36],[44,36],[30,44]].map(([x,y],i) =>
              <rect key={`e${i}`} x={x} y={y} width="4" height="4" rx="0.5" fill="#E84D25" />
            )}
          </g>
          {/* Scan line */}
          <line x1="440" y1="100" x2="500" y2="100" stroke="#E84D25" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
            <animate attributeName="y1" values="80;130;80" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="y2" values="80;130;80" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Tagine - floating left */}
        <g filter="url(#fss)">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="5s" repeatCount="indefinite" />
          <ellipse cx="90" cy="220" rx="48" ry="14" fill="#CD853F" opacity="0.3" />
          <ellipse cx="90" cy="210" rx="42" ry="16" fill="url(#h-tagine)" />
          <ellipse cx="90" cy="205" rx="34" ry="10" fill="#8B6914" opacity="0.4" />
          <circle cx="78" cy="203" r="4" fill="#D4A017" opacity="0.6" /><circle cx="96" cy="201" r="3.5" fill="#B8860B" opacity="0.5" /><circle cx="86" cy="200" r="3" fill="#DAA520" opacity="0.5" />
          <path d="M54 205 Q90 130 126 205" fill="url(#h-lid)" />
          <path d="M54 205 Q90 130 126 205" fill="none" stroke="#B8860B" strokeWidth="0.5" opacity="0.3" />
          <path d="M65 195 Q90 148 115 195" fill="none" stroke="#B8860B" strokeWidth="0.8" opacity="0.2" />
          <path d="M74 185 Q90 158 106 185" fill="none" stroke="#B8860B" strokeWidth="0.6" opacity="0.15" />
          <circle cx="90" cy="138" r="5" fill="#CD7F32" /><circle cx="90" cy="138" r="3" fill="#E8A44E" />
          {/* Steam */}
          <path d="M82 132 Q78 118 82 108" stroke="#999" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3">
            <animate attributeName="d" values="M82 132 Q78 118 82 108;M82 132 Q86 116 80 104;M82 132 Q78 118 82 108" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M98 132 Q102 120 98 110" stroke="#999" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.25">
            <animate attributeName="d" values="M98 132 Q102 120 98 110;M98 132 Q94 118 100 106;M98 132 Q102 120 98 110" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.08;0.25" dur="3.5s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Mint tea - floating bottom left */}
        <g filter="url(#fss)">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="3.5s" repeatCount="indefinite" />
          <ellipse cx="110" cy="380" rx="28" ry="8" fill="#E8E0D0" /><ellipse cx="110" cy="378" rx="24" ry="6" fill="#F5F0E8" />
          <path d="M96 340 L100 374 L120 374 L124 340 Z" fill="url(#h-tea)" stroke="#D4A017" strokeWidth="0.6" strokeOpacity="0.3" />
          <path d="M99 355 L101 372 L119 372 L121 355 Z" fill="url(#h-liquid)" opacity="0.7" />
          <path d="M97 348 L123 348" stroke="#D4A017" strokeWidth="0.8" opacity="0.4" />
          <path d="M97 352 L123 352" stroke="#D4A017" strokeWidth="0.5" opacity="0.25" />
          <path d="M96 340 L124 340" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <g transform="translate(107,336) rotate(-15)"><ellipse rx="6" ry="3" fill="#4A9A6E" /><line x1="-4" y1="0" x2="4" y2="0" stroke="#3D8B5E" strokeWidth="0.4" /></g>
        </g>

        {/* Couscous plate - floating bottom right */}
        <g filter="url(#fss)">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-7; 0,0" dur="4.5s" repeatCount="indefinite" />
          <ellipse cx="490" cy="310" rx="44" ry="12" fill="#000" opacity="0.06" />
          <ellipse cx="490" cy="300" rx="44" ry="16" fill="url(#h-bowl)" />
          <ellipse cx="490" cy="298" rx="40" ry="14" fill="#FAFAFA" stroke="#E0D8C8" strokeWidth="0.5" />
          <ellipse cx="490" cy="298" rx="38" ry="13" fill="none" stroke="#D4A017" strokeWidth="0.4" opacity="0.3" />
          <ellipse cx="490" cy="292" rx="30" ry="14" fill="#F5DEB3" /><ellipse cx="490" cy="289" rx="26" ry="10" fill="#EED8A0" />
          <circle cx="478" cy="286" r="4" fill="#E84D25" opacity="0.5" /><circle cx="500" cy="284" r="3.5" fill="#4A9A6E" opacity="0.5" />
          <circle cx="486" cy="282" r="3" fill="#D4A017" opacity="0.5" /><circle cx="496" cy="288" r="2.5" fill="#E84D25" opacity="0.4" /><circle cx="483" cy="290" r="2" fill="#4A9A6E" opacity="0.4" />
        </g>

        {/* Delivery scooter badge */}
        <g opacity="0.7">
          <animateTransform attributeName="transform" type="translate" values="0,0; 5,-4; 0,0" dur="4s" repeatCount="indefinite" />
          <g transform="translate(450,200) scale(0.9)">
            <rect x="-10" y="-10" width="56" height="42" rx="12" fill="white" stroke="#4A9A6E" strokeWidth="0.8" strokeOpacity="0.2" />
            <circle cx="8" cy="18" r="6" fill="none" stroke="#4A9A6E" strokeWidth="1.5" /><circle cx="8" cy="18" r="2" fill="#4A9A6E" />
            <circle cx="30" cy="18" r="6" fill="none" stroke="#4A9A6E" strokeWidth="1.5" /><circle cx="30" cy="18" r="2" fill="#4A9A6E" />
            <path d="M8 12 L14 2 L28 2 L32 8 L30 12" fill="none" stroke="#4A9A6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="-4" width="14" height="8" rx="2" fill="#E84D25" opacity="0.7" />
          </g>
        </g>

        {/* Rating badge - floating */}
        <g opacity="0.6">
          <animateTransform attributeName="transform" type="translate" values="0,0; 3,-5; 0,0" dur="3s" repeatCount="indefinite" />
          <g transform="translate(130,60)">
            <rect x="-8" y="-8" width="58" height="28" rx="14" fill="white" stroke="#D4A017" strokeWidth="0.6" strokeOpacity="0.3" />
            {[0,1,2,3,4].map(i => <polygon key={i} points={S} fill="#D4A017" transform={`translate(${i*10-4},-2) scale(0.65)`} />)}
          </g>
        </g>

        {/* Scattered accent stars */}
        <g opacity="0.4"><animateTransform attributeName="transform" type="translate" values="0,0; -3,-4; 0,0" dur="3.8s" repeatCount="indefinite" /><polygon points={S} fill="#D4A017" transform="translate(165,430) scale(0.9)" /></g>
        <g opacity="0.3"><animateTransform attributeName="transform" type="translate" values="0,0; 2,-3; 0,0" dur="4.2s" repeatCount="indefinite" /><polygon points={S} fill="#E84D25" transform="translate(540,170) scale(0.7)" /></g>

        {/* Decorative dots */}
        <circle cx="155" cy="340" r="3" fill="#E84D25" opacity="0.15" />
        <circle cx="445" cy="420" r="4" fill="#4A9A6E" opacity="0.12" />
        <circle cx="530" cy="140" r="3" fill="#D4A017" opacity="0.15" />
        <circle cx="60" cy="300" r="2.5" fill="#E84D25" opacity="0.1" />
        <circle cx="555" cy="260" r="2" fill="#4A9A6E" opacity="0.1" />
      </svg>
    </div>
  );
};
