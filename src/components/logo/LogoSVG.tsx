interface LogoSVGProps {
  size?: number
  className?: string
}

export default function LogoSVG({ size = 40, className }: LogoSVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NiwaMirî"
    >
      <rect width="400" height="400" rx="90" ry="90" fill="#2e7048" stroke="#1d5533" strokeWidth="2"/>

      <defs>
        <clipPath id="niwamiri-clip">
          <rect width="400" height="400" rx="90" ry="90"/>
        </clipPath>
      </defs>

      <g clipPath="url(#niwamiri-clip)">

        {/* Maceta */}
        <rect x="160" y="279" width="80" height="7" rx="2"
              fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <path d="M 165 286 L 163 307 L 237 307 L 235 286 Z"
              fill="#2e7048" stroke="#F5F0E8" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M 168 307 L 166 314 L 176 314 L 175 307"
              fill="#2e7048" stroke="#F5F0E8" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M 225 307 L 224 314 L 234 314 L 232 307"
              fill="#2e7048" stroke="#F5F0E8" strokeWidth="1.5" strokeLinejoin="round"/>

        {/* Nebari */}
        <path d="M 194 279 C 185 275 175 273 167 276"
              fill="none" stroke="#F5F0E8" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M 206 279 C 215 275 225 273 233 276"
              fill="none" stroke="#F5F0E8" strokeWidth="1.8" strokeLinecap="round"/>

        {/* Tronco Moyogi */}
        <path d="
          M 189 279
          C 184 258 188 238 200 218
          C 210 200 215 180 207 158
          C 200 140 193 125 191 110
          L 196 108
          C 198 123 204 138 214 158
          C 222 180 222 200 216 218
          C 210 238 216 258 211 279
          Z
        " fill="#F5F0E8"/>

        {/* Ramas */}
        <path d="M 194 252 C 178 248 163 245 147 243"
              fill="none" stroke="#F5F0E8" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M 211 242 C 223 239 233 237 246 236"
              fill="none" stroke="#F5F0E8" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M 202 207 C 187 203 172 199 157 198"
              fill="none" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 213 197 C 224 194 233 192 244 191"
              fill="none" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 206 162 C 194 158 182 156 168 155"
              fill="none" stroke="#F5F0E8" strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M 212 153 C 221 151 229 149 239 149"
              fill="none" stroke="#F5F0E8" strokeWidth="1.7" strokeLinecap="round"/>

        {/* Follaje — pad inferior izquierdo */}
        <circle cx="129" cy="238" r="14" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="143" cy="233" r="15" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="157" cy="237" r="14" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>

        {/* Follaje — pad inferior derecho */}
        <circle cx="236" cy="231" r="12" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="249" cy="228" r="13" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="260" cy="231" r="11" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>

        {/* Follaje — pad medio izquierdo */}
        <circle cx="139" cy="194" r="12" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="151" cy="189" r="13" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="163" cy="193" r="12" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>

        {/* Follaje — pad medio derecho */}
        <circle cx="233" cy="188" r="11" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="245" cy="185" r="12" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="256" cy="188" r="10" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>

        {/* Follaje — pad superior izquierdo */}
        <circle cx="151" cy="152" r="11" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="163" cy="147" r="12" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="174" cy="151" r="11" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>

        {/* Follaje — pad superior derecho */}
        <circle cx="229" cy="147" r="10" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="240" cy="144" r="11" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="250" cy="147" r="10" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>

        {/* Follaje — ápice */}
        <circle cx="184" cy="116" r="10" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="195" cy="112" r="11" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>
        <circle cx="206" cy="115" r="10" fill="#2e7048" stroke="#F5F0E8" strokeWidth="2"/>

        {/* Distintivo argentino — franja celeste-blanca-celeste */}
        <rect x="164" y="291.5" width="72" height="2"   rx="0.3" fill="#74ACDF" opacity="0.70"/>
        <rect x="164" y="293.5" width="72" height="2"   rx="0"   fill="#FFFFFF" opacity="0.75"/>
        <rect x="164" y="295.5" width="72" height="2"   rx="0.3" fill="#74ACDF" opacity="0.70"/>

        {/* Sol de Mayo */}
        <g transform="translate(200, 294.5)" opacity="0.85">
          <line x1="0"    y1="-3.5" x2="0"   y2="-7"  stroke="#F5C040" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="0"    y1=" 3.5" x2="0"   y2=" 7"  stroke="#F5C040" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="-3.5" y1="0"    x2="-7"  y2="0"   stroke="#F5C040" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1=" 3.5" y1="0"    x2=" 7"  y2="0"   stroke="#F5C040" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="-2.5" y1="-2.5" x2="-5"  y2="-5"  stroke="#F5C040" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1=" 2.5" y1="-2.5" x2=" 5"  y2="-5"  stroke="#F5C040" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="-2.5" y1=" 2.5" x2="-5"  y2=" 5"  stroke="#F5C040" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1=" 2.5" y1=" 2.5" x2=" 5"  y2=" 5"  stroke="#F5C040" strokeWidth="1.1" strokeLinecap="round"/>
          <circle cx="0" cy="0" r="3" fill="#F5C040"/>
        </g>

      </g>
    </svg>
  )
}
