svg_content_v2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="100%" height="100%" style="font-family: 'Georgia', 'Times New Roman', serif; background-color: #e8d3a7;">
  <defs>
    <!-- Paper texture filter -->
    <filter id="paper-texture">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
      <feDiffuseLighting in="noise" lighting-color="#f7ebcf" surfaceScale="2" result="light">
        <feDistantLight azimuth="60" elevation="50" />
      </feDiffuseLighting>
      <feBlend mode="multiply" in="SourceGraphic" in2="light" />
    </filter>

    <style>
      .text-title { font-size: 22px; font-weight: bold; fill: #5a180d; font-style: italic; letter-spacing: 1px; }
      .text-ocean { font-size: 26px; font-weight: bold; fill: #2c4a5e; letter-spacing: 3px; opacity: 0.85; }
      .text-sub { font-size: 13px; fill: #4a2e1b; font-style: italic; }
      .text-line { font-size: 15px; font-weight: bold; fill: #6b1d10; letter-spacing: 1.5px; }
      .mountain-red { fill: #ab2a19; stroke: #5a1106; stroke-width: 2; stroke-linejoin: round; }
      .mountain-red-dark { fill: #821c0e; stroke: #450b04; stroke-width: 1.5; stroke-linejoin: round; }
      .island { fill: #d4b47d; stroke: #8b4a2b; stroke-width: 1.2; stroke-linejoin: round; }
    </style>
  </defs>

  <!-- Outer Map Border -->
  <rect x="0" y="0" width="1000" height="700" fill="#362010" />
  <rect x="12" y="12" width="976" height="676" fill="#eed9b2" />

  <!-- Canvas with parchment background -->
  <g filter="url(#paper-texture)">
    <rect x="18" y="18" width="964" height="664" fill="#e8cf9f" stroke="#7a5230" stroke-width="2" />

    <!-- Fascia di bonaccia (Horizontal bands across the map) -->
    <rect x="18" y="260" width="964" height="264" fill="#edd6a8" opacity="0.9" />

    <!-- Grand Line Central Sea Path -->
    <line x1="18" y1="280" x2="982" y2="280" stroke="#b89662" stroke-dasharray="6,4" stroke-width="1.5" />
    <line x1="18" y1="420" x2="982" y2="420" stroke="#b89662" stroke-dasharray="6,4" stroke-width="1.5" />
    <rect x="18" y="280" width="964" height="140" fill="#f2e2c2" opacity="0.6" />

    <!-- LEFT SIDE CONTINUOUS RED LINE MOUNTAIN -->
    <path class="mountain-red" d="M 18,18
             L 70,18 L 45,70 L 82,120 L 52,180 L 74,240
             L 55,300 L 80,350 L 50,420 L 75,490 L 45,560
             L 72,620 L 55,682 L 18,682 Z" />
    <path class="mountain-red-dark" d="M 18,70
             L 45,70 L 32,130 L 50,190 L 34,260
             L 18,320 L 36,390 L 18,470 L 30,550
             L 18,620 L 34,682 L 18,682 Z" />

    <!-- RIGHT SIDE CONTINUOUS RED LINE MOUNTAIN -->
    <path class="mountain-red" d="M 982,18
             L 930,18 L 955,70 L 918,120 L 948,180 L 926,240
             L 945,300 L 920,350 L 950,420 L 925,490 L 955,560
             L 928,620 L 945,682 L 982,682 Z" />
    <path class="mountain-red-dark" d="M 982,70
             L 955,70 L 968,130 L 950,190 L 966,260
             L 982,320 L 964,390 L 982,470 L 970,550
             L 982,620 L 966,682 L 982,682 Z" />

    <!-- CENTRAL RED LINE CONTINENT & MOUNTAINS -->
    <!-- North Central Red Line -->
    <path class="mountain-red" d="M 460,18 
             L 540,18 L 515,70 L 545,130 L 510,190 L 540,260 
             L 460,260 L 485,190 L 455,130 L 485,70 Z" />
    <path class="mountain-red-dark" d="M 500,18 L 540,18 L 515,70 L 530,130 L 510,190 L 525,260 L 500,260 L 485,190 L 500,130 Z" opacity="0.6" />

    <!-- South Central Red Line -->
    <path class="mountain-red" d="M 460,440 
             L 540,440 L 515,500 L 545,560 L 510,620 L 535,682 
             L 460,682 L 485,620 L 455,560 L 485,500 Z" />
    <path class="mountain-red-dark" d="M 500,440 L 540,440 L 515,500 L 530,560 L 510,620 L 525,682 L 500,682 L 485,620 L 500,560 Z" opacity="0.6" />

    <!-- REVERSE MOUNTAIN (Center intersection) -->
    <polygon points="440,260 560,260 580,350 560,440 440,440 420,350" fill="#a12817" stroke="#4a0c04" stroke-width="3.5" />
    <polygon points="460,280 540,280 555,350 540,420 460,420 445,350" fill="#ba3320" />
    
    <!-- Reverse Mountain Water Canals -->
    <path d="M 425,300 L 500,350 L 575,300 M 425,400 L 500,350 L 575,400 M 500,260 L 500,440" stroke="#f2e2c2" stroke-width="4.5" fill="none" />
    <circle cx="500" cy="350" r="14" fill="#edd6a8" stroke="#7a2012" stroke-width="2.5" />

    <!-- ARCHIPELAGOS & ISLANDS SCATTERED (NO rectangular landmass borders) -->
    <!-- North Blue Islands -->
    <path class="island" d="M 140,80 C 170,70 200,90 220,110 C 200,140 160,130 130,110 Z" />
    <path class="island" d="M 280,100 C 320,90 350,120 330,150 C 290,160 260,130 280,100 Z" />
    <circle class="island" cx="110" cy="180" r="14" />
    <circle class="island" cx="390" cy="190" r="18" />

    <!-- West Blue Islands -->
    <path class="island" d="M 120,520 C 150,500 190,530 170,570 C 130,580 100,550 120,520 Z" />
    <path class="island" d="M 260,580 C 310,560 340,600 310,630 C 270,640 240,610 260,580 Z" />
    <circle class="island" cx="360" cy="500" r="16" />
    <circle class="island" cx="200" cy="620" r="12" />

    <!-- East Blue Islands -->
    <path class="island" d="M 640,90 C 680,75 720,105 700,135 C 660,145 630,120 640,90 Z" />
    <path class="island" d="M 800,110 C 840,95 870,130 840,160 C 800,170 770,140 800,110 Z" />
    <circle class="island" cx="600" cy="190" r="15" />
    <circle class="island" cx="890" cy="180" r="14" />

    <!-- South Blue Islands -->
    <path class="island" d="M 650,530 C 690,510 730,540 710,580 C 670,590 630,560 650,530 Z" />
    <path class="island" d="M 810,560 C 850,540 880,580 850,610 C 810,620 780,590 810,560 Z" />
    <circle class="island" cx="600" cy="620" r="16" />
    <circle class="island" cx="880" cy="500" r="13" />

    <!-- Grand Line Islands (Nuovo Mondo - Left side) -->
    <circle class="island" cx="75" cy="350" r="10" />
    <circle class="island" cx="135" cy="325" r="7" />
    <circle class="island" cx="205" cy="370" r="12" />
    <circle class="island" cx="275" cy="340" r="8" />
    <circle class="island" cx="345" cy="365" r="14" />
    <circle class="island" cx="420" cy="332" r="6" />
    <circle class="island" cx="470" cy="355" r="9" />

    <!-- Grand Line Islands (Paradise - Right side) -->
    <circle class="island" cx="530" cy="355" r="8" />
    <circle class="island" cx="590" cy="330" r="13" />
    <circle class="island" cx="665" cy="370" r="7" />
    <circle class="island" cx="735" cy="340" r="11" />
    <circle class="island" cx="810" cy="365" r="9" />
    <circle class="island" cx="890" cy="332" r="6" />
    <circle class="island" cx="925" cy="350" r="8" />

    <!-- TEXT LABELS -->

    <!-- Red Line Title (Top Center) -->
    <text x="500" y="55" class="text-title" text-anchor="middle">Red Line</text>

    <!-- Reverse Mountain Text -->
    <text x="500" y="248" class="text-sub" font-weight="bold" text-anchor="middle">Reverse Mountain</text>

    <!-- 4 Main Oceans (Without box borders) -->
    <text x="240" y="160" class="text-ocean" text-anchor="middle">NORTH BLUE</text>
    <text x="760" y="160" class="text-ocean" text-anchor="middle">EAST BLUE</text>
    <text x="240" y="560" class="text-ocean" text-anchor="middle">WEST BLUE</text>
    <text x="760" y="560" class="text-ocean" text-anchor="middle">SOUTH BLUE</text>

    <!-- Fascia di bonaccia (Above & below Grand Line) -->
    <text x="240" y="250" class="text-sub" text-anchor="middle">Fascia di bonaccia</text>
    <text x="240" y="450" class="text-sub" text-anchor="middle">Fascia di bonaccia</text>
    <text x="760" y="250" class="text-sub" text-anchor="middle">Fascia di bonaccia</text>
    <text x="760" y="450" class="text-sub" text-anchor="middle">Fascia di bonaccia</text>

    <!-- Grand Line -->
    <text x="500" y="500" class="text-line" text-anchor="middle">Grand Line</text>

    <!-- Nuovo Mondo (A Sinistra nel Grand Line) -->
    <text x="190" y="354" class="text-sub" font-weight="bold" text-anchor="middle">Nuovo Mondo</text>

    <!-- Paradise (A Destra nel Grand Line) -->
    <text x="810" y="354" class="text-sub" font-weight="bold" text-anchor="middle">Paradise</text>

    <!-- Decorative Compass Rose -->
    <g transform="translate(120, 620)">
      <circle cx="0" cy="0" r="22" fill="none" stroke="#7a5230" stroke-width="1.2" />
      <path d="M 0,-26 L 4,-6 L 26,0 L 4,6 L 0,26 L -4,6 L -26,0 L -4,-6 Z" fill="#aa2c1b" stroke="#362010" />
      <text x="0" y="-29" font-size="9" font-weight="bold" fill="#362010" text-anchor="middle">N</text>
      <text x="0" y="33" font-size="9" font-weight="bold" fill="#362010" text-anchor="middle">S</text>
      <text x="31" y="0" font-size="9" font-weight="bold" fill="#362010" text-anchor="middle">E</text>
      <text x="-31" y="0" font-size="9" font-weight="bold" fill="#362010" text-anchor="middle">W</text>
    </g>

  </g>
</svg>
"""

with open("mappa_one_piece.svg", "w", encoding="utf-8") as f:
    f.write(svg_content_v2)

print("mappa_one_piece.svg generated successfully.")