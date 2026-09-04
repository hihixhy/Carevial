<template>
  <div class="relative w-[480px] h-[420px]">
    <svg class="absolute" width="0" height="0">
      <defs>
        <filter id="crayon" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.4" result="blurred" />
          <feComponentTransfer in="blurred" result="final">
            <feFuncA type="linear" slope="0.92" intercept="0" />
          </feComponentTransfer>
        </filter>
        <filter id="crayon-fill" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="noise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="rough-line" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="turbulence" baseFrequency="0.15" numOctaves="2" result="noise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
    <svg
      class="absolute inset-0 w-full h-full"
      viewBox="0 0 480 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      filter="url(#crayon)"
    >
      <ellipse
        cx="240"
        cy="210"
        rx="200"
        ry="170"
        fill="#FFF5F2"
        opacity="0.6"
        filter="url(#crayon-fill)"
      />
      <ellipse
        cx="210"
        cy="330"
        rx="65"
        ry="12"
        fill="#E8D5D0"
        opacity="0.4"
        filter="url(#crayon-fill)"
      />
      <path
        d="M155 150 C155 105, 170 90, 210 90 C250 90, 265 105, 265 150 L265 220 C265 235, 250 245, 210 245 C170 245, 155 235, 155 220 Z"
        fill="#FAD0C9"
        stroke="#3D3D3D"
        stroke-width="2.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path
        d="M156 218 Q210 228 264 218"
        stroke="#3D3D3D"
        stroke-width="2.2"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <ellipse cx="185" cy="155" rx="13" ry="15" fill="#3D3D3D" />
      <circle cx="188" cy="150" r="4.5" fill="white" />
      <circle cx="182" cy="160" r="2" fill="white" />
      <ellipse cx="235" cy="155" rx="13" ry="15" fill="#3D3D3D" />
      <circle cx="238" cy="150" r="4.5" fill="white" />
      <circle cx="232" cy="160" r="2" fill="white" />
      <ellipse
        cx="170"
        cy="178"
        rx="11"
        ry="7"
        fill="#E8A5A5"
        opacity="0.45"
        filter="url(#crayon-fill)"
      />
      <ellipse
        cx="250"
        cy="178"
        rx="11"
        ry="7"
        fill="#E8A5A5"
        opacity="0.45"
        filter="url(#crayon-fill)"
      />
      <path
        d="M188 192 Q210 212 232 192"
        stroke="#3D3D3D"
        stroke-width="2.5"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <path d="M198 202 Q210 212 222 202" fill="#E8A5A5" opacity="0.6" />
      <path
        d="M155 165 Q125 140 115 125"
        stroke="#3D3D3D"
        stroke-width="2.8"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <circle
        cx="112"
        cy="122"
        r="7"
        fill="#FAD0C9"
        stroke="#3D3D3D"
        stroke-width="2.2"
        filter="url(#crayon-fill)"
      />
      <path
        d="M265 165 Q290 140 300 130"
        stroke="#3D3D3D"
        stroke-width="2.8"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <circle
        cx="303"
        cy="127"
        r="7"
        fill="#FAD0C9"
        stroke="#3D3D3D"
        stroke-width="2.2"
        filter="url(#crayon-fill)"
      />
      <path
        d="M295 117 C295 111, 302 111, 302 117 C302 111, 309 111, 309 117 C309 123, 302 130, 302 130 C302 130, 295 123, 295 117Z"
        fill="#E87D7D"
        stroke="#3D3D3D"
        stroke-width="1.8"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path d="M178 245 L178 275" stroke="#3D3D3D" stroke-width="2.8" stroke-linecap="round" />
      <ellipse
        cx="178"
        cy="280"
        rx="12"
        ry="6"
        fill="#FAD0C9"
        stroke="#3D3D3D"
        stroke-width="2.2"
        filter="url(#crayon-fill)"
      />
      <path d="M242 245 L242 275" stroke="#3D3D3D" stroke-width="2.8" stroke-linecap="round" />
      <ellipse
        cx="242"
        cy="280"
        rx="12"
        ry="6"
        fill="#FAD0C9"
        stroke="#3D3D3D"
        stroke-width="2.2"
        filter="url(#crayon-fill)"
      />
      <ellipse
        cx="370"
        cy="355"
        rx="38"
        ry="8"
        fill="#E8D5D0"
        opacity="0.35"
        filter="url(#crayon-fill)"
      />
      <path
        d="M335 255 C335 245, 340 240, 350 240 L390 240 C400 240, 405 245, 405 255 L405 335 C405 350, 395 355, 370 355 C345 355, 335 350, 335 335 Z"
        fill="#FDF0E0"
        stroke="#3D3D3D"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <rect
        x="350"
        y="220"
        width="40"
        height="22"
        rx="4"
        fill="#FDF0E0"
        stroke="#3D3D3D"
        stroke-width="2.2"
        filter="url(#crayon-fill)"
      />
      <rect
        x="343"
        y="198"
        width="54"
        height="26"
        rx="6"
        fill="#E8A090"
        stroke="#3D3D3D"
        stroke-width="2.2"
        filter="url(#crayon-fill)"
      />
      <line
        x1="355"
        y1="198"
        x2="355"
        y2="220"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <line
        x1="365"
        y1="198"
        x2="365"
        y2="220"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <line
        x1="375"
        y1="198"
        x2="375"
        y2="220"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <line
        x1="385"
        y1="198"
        x2="385"
        y2="220"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <rect
        x="348"
        y="265"
        width="44"
        height="50"
        rx="7"
        fill="white"
        stroke="#3D3D3D"
        stroke-width="1.6"
        filter="url(#crayon-fill)"
      />
      <line
        x1="355"
        y1="280"
        x2="385"
        y2="280"
        stroke="#C4B5B0"
        stroke-width="2.2"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <line
        x1="355"
        y1="293"
        x2="378"
        y2="293"
        stroke="#C4B5B0"
        stroke-width="2.2"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <line
        x1="355"
        y1="306"
        x2="382"
        y2="306"
        stroke="#C4B5B0"
        stroke-width="2.2"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <circle cx="362" cy="315" r="3.5" fill="#3D3D3D" />
      <circle cx="378" cy="315" r="3.5" fill="#3D3D3D" />
      <path
        d="M365 322 Q370 326 375 322"
        stroke="#3D3D3D"
        stroke-width="1.8"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <ellipse
        cx="356"
        cy="318"
        rx="4"
        ry="2.5"
        fill="#E8A5A5"
        opacity="0.4"
        filter="url(#crayon-fill)"
      />
      <ellipse
        cx="384"
        cy="318"
        rx="4"
        ry="2.5"
        fill="#E8A5A5"
        opacity="0.4"
        filter="url(#crayon-fill)"
      />
      <rect
        x="355"
        y="55"
        width="52"
        height="55"
        rx="8"
        fill="white"
        stroke="#3D3D3D"
        stroke-width="2.2"
        filter="url(#crayon-fill)"
      />
      <rect
        x="365"
        y="45"
        width="10"
        height="16"
        rx="4"
        fill="#D4A5A5"
        stroke="#3D3D3D"
        stroke-width="1.8"
        filter="url(#crayon-fill)"
      />
      <rect
        x="387"
        y="45"
        width="10"
        height="16"
        rx="4"
        fill="#D4A5A5"
        stroke="#3D3D3D"
        stroke-width="1.8"
        filter="url(#crayon-fill)"
      />
      <circle cx="370" cy="82" r="3" fill="#D4C5C0" />
      <circle cx="381" cy="82" r="3" fill="#D4C5C0" />
      <circle cx="392" cy="82" r="3" fill="#D4C5C0" />
      <circle cx="370" cy="94" r="3" fill="#D4C5C0" />
      <circle cx="381" cy="94" r="3.5" fill="#E8A5A5" stroke="#3D3D3D" stroke-width="1.2" />
      <circle cx="392" cy="94" r="3" fill="#D4C5C0" />
      <circle cx="370" cy="106" r="3" fill="#D4C5C0" />
      <circle cx="381" cy="106" r="3" fill="#D4C5C0" />
      <path
        d="M374 120 Q381 124 388 120"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <rect
        x="190"
        y="25"
        width="105"
        height="42"
        rx="14"
        fill="white"
        stroke="#3D3D3D"
        stroke-width="2"
        filter="url(#crayon-fill)"
      />
      <path
        d="M235 67 L240 78 L245 67"
        fill="white"
        stroke="#3D3D3D"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <text
        x="242"
        y="50"
        text-anchor="middle"
        font-family="var(--font-body), sans-serif"
        font-size="12"
        font-weight="600"
        fill="#3D3D3D"
      >
        记得吃药~
      </text>
      <path
        d="M85 55 L88 63 L96 63 L90 68 L92 76 L85 71 L78 76 L80 68 L74 63 L82 63 Z"
        fill="#F0C8A0"
        stroke="#3D3D3D"
        stroke-width="1.2"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path
        d="M325 45 L327 51 L333 51 L328 55 L330 61 L325 57 L320 61 L322 55 L317 51 L323 51 Z"
        fill="#E8A5A5"
        stroke="#3D3D3D"
        stroke-width="1"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path
        d="M65 185 L67 191 L73 191 L68 195 L70 201 L65 197 L60 201 L62 195 L57 191 L63 191 Z"
        fill="#F0C8A0"
        stroke="#3D3D3D"
        stroke-width="1"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path
        d="M420 280 L422 286 L428 286 L423 290 L425 296 L420 292 L415 296 L417 290 L412 286 L418 286 Z"
        fill="#E8A5A5"
        stroke="#3D3D3D"
        stroke-width="1"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path
        d="M95 185 C95 178, 102 178, 102 185 C102 178, 109 178, 109 185 C109 192, 102 200, 102 200 C102 200, 95 192, 95 185Z"
        fill="#E8A5A5"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path
        d="M430 205 C430 199, 436 199, 436 205 C436 199, 442 199, 442 205 C442 211, 436 218, 436 218 C436 218, 430 211, 430 205Z"
        fill="#E8A5A5"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linejoin="round"
        filter="url(#crayon-fill)"
      />
      <path
        d="M335 105 C335 101, 339 101, 339 105 C339 101, 343 101, 343 105 C343 109, 339 114, 339 114 C339 114, 335 109, 335 105Z"
        fill="#D4A5A5"
        stroke="#3D3D3D"
        stroke-width="1"
        stroke-linejoin="round"
      />
      <circle
        cx="120"
        cy="300"
        r="18"
        fill="#E8F0D8"
        stroke="#3D3D3D"
        stroke-width="2"
        filter="url(#crayon-fill)"
      />
      <line
        x1="120"
        y1="282"
        x2="120"
        y2="318"
        stroke="#3D3D3D"
        stroke-width="1.8"
        stroke-linecap="round"
        filter="url(#rough-line)"
      />
      <circle cx="112" cy="295" r="2.5" fill="#3D3D3D" />
      <circle cx="128" cy="295" r="2.5" fill="#3D3D3D" />
      <path
        d="M114 303 Q120 308 126 303"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <ellipse
        cx="310"
        cy="320"
        rx="14"
        ry="22"
        fill="#C8E0F0"
        stroke="#3D3D3D"
        stroke-width="1.8"
        filter="url(#crayon-fill)"
      />
      <path
        d="M296 320 Q310 323 324 320"
        stroke="#3D3D3D"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <circle cx="305" cy="314" r="2" fill="#3D3D3D" />
      <circle cx="315" cy="314" r="2" fill="#3D3D3D" />
      <path
        d="M307 322 Q310 325 313 322"
        stroke="#3D3D3D"
        stroke-width="1.2"
        stroke-linecap="round"
        fill="none"
        filter="url(#rough-line)"
      />
      <circle cx="80" cy="255" r="3.5" fill="#F0C8A0" opacity="0.6" filter="url(#crayon-fill)" />
      <circle cx="420" cy="155" r="3" fill="#D4A5A5" opacity="0.5" filter="url(#crayon-fill)" />
      <circle cx="320" cy="185" r="2.5" fill="#E8A5A5" opacity="0.5" filter="url(#crayon-fill)" />
      <circle cx="145" cy="225" r="3" fill="#F0C8A0" opacity="0.4" filter="url(#crayon-fill)" />
      <circle cx="280" cy="195" r="2" fill="#D4A5A5" opacity="0.5" />
      <circle cx="90" cy="340" r="2.5" fill="#E8A5A5" opacity="0.4" />
      <circle cx="410" cy="330" r="3" fill="#F0C8A0" opacity="0.5" filter="url(#crayon-fill)" />
      <circle cx="270" cy="350" r="2" fill="#D4A5A5" opacity="0.4" />
      <circle cx="330" cy="375" r="2.5" fill="#E8A5A5" opacity="0.4" />
      <circle
        cx="150"
        cy="120"
        r="8"
        stroke="#E8D5B8"
        stroke-width="1.5"
        stroke-dasharray="4 3"
        fill="none"
        opacity="0.6"
      />
      <circle
        cx="400"
        cy="240"
        r="10"
        stroke="#D4A5A5"
        stroke-width="1.5"
        stroke-dasharray="3 4"
        fill="none"
        opacity="0.5"
      />
      <circle
        cx="105"
        cy="310"
        r="6"
        stroke="#F0C8A0"
        stroke-width="1.5"
        stroke-dasharray="2 3"
        fill="none"
        opacity="0.5"
      />
    </svg>
  </div>
</template>
