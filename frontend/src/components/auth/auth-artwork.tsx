export function AuthArtwork() {
  return (
    <svg
      viewBox="0 0 420 440"
      role="img"
      aria-label="Ilustrasi bola bumi dengan kotak berisi sayur dan buah"
      className="auth-artwork"
    >
      <defs>
        <linearGradient id="auth-globe" x1="90" y1="60" x2="330" y2="320">
          <stop stopColor="#E7F8EE" />
          <stop offset="1" stopColor="#B8E3CE" />
        </linearGradient>
        <linearGradient id="auth-box" x1="110" y1="300" x2="310" y2="390">
          <stop stopColor="#EFC488" />
          <stop offset="1" stopColor="#D9A466" />
        </linearGradient>
        <linearGradient id="auth-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#69C282" />
          <stop offset="1" stopColor="#2F8F56" />
        </linearGradient>
      </defs>

      <ellipse cx="212" cy="402" rx="142" ry="18" fill="#0B7A43" opacity="0.1" />

      <g opacity="0.95">
        <g transform="translate(46 225) rotate(-48)">
          <path d="M0 30C0 12 13 0 31 0c0 18-13 30-31 30Z" fill="#56B875" />
        </g>
        <g transform="translate(355 230) rotate(38)">
          <path d="M0 30C0 12 13 0 31 0c0 18-13 30-31 30Z" fill="#3D9F63" />
        </g>
        <g transform="translate(64 166) rotate(-24)">
          <path d="M0 24C0 10 10 0 25 0c0 14-10 24-25 24Z" fill="#8BD3A1" />
        </g>
        <g transform="translate(342 145) rotate(24)">
          <path d="M0 24C0 10 10 0 25 0c0 14-10 24-25 24Z" fill="#A9DFB9" />
        </g>
      </g>

      <circle cx="210" cy="188" r="126" fill="url(#auth-globe)" stroke="#9FD3B5" />
      <path
        d="M104 155c20-35 50-56 86-62 19-3 33 3 43 15 9 11 3 24-5 35-11 15-31 17-45 29-12 10-13 25-25 32-12 7-27 6-38-4-14-13-20-28-16-45Z"
        fill="#87CAA1"
        opacity="0.95"
      />
      <path
        d="M248 219c24-17 54-8 63 15 8 21-3 45-23 59-15 11-36 15-54 8-9-4-12-15-8-25 5-13 9-19 11-31 2-11 2-19 11-26Z"
        fill="#6CBB8C"
        opacity="0.9"
      />
      <path
        d="M147 273c11-6 28-2 34 9 6 12 1 27-9 37-11 11-27 12-37 2-8-8-9-22-3-32 4-7 8-11 15-16Z"
        fill="#A2DBAF"
      />
      <path
        d="M93 188c19 4 33 19 35 39M226 91c-4 20-18 34-37 41M259 165c-16 1-31 10-39 24"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.55"
      />

      <g>
        <path
          d="M110 286c14-30 38-44 70-50 8-2 14-1 17 5l9 20c4 10-2 17-12 21-25 10-48 17-67 18-12 1-20-4-17-14Z"
          fill="#F0C679"
        />
        <path
          d="M116 290c20-18 41-27 65-31M141 300c6-17 17-26 30-33"
          stroke="#D9A259"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.65"
        />
      </g>

      <g>
        <path
          d="M160 246c13-17 36-18 49-2l-10 70c-2 12-12 16-18 4l-21-72Z"
          fill="#F09A4B"
        />
        <path
          d="M176 243c-9-16-5-32 8-43M188 243c2-18 12-30 27-35M198 250c9-11 21-16 34-14"
          stroke="#4CAF6D"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M172 272h18M177 292h16"
          stroke="#D97D35"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      <g>
        <path
          d="M228 236c8-23 31-34 54-25 16 6 24 20 23 35l-6 35c-2 12-16 16-24 6l-47-51Z"
          fill="#4EAB6F"
        />
        <path
          d="M236 231c8-13 22-18 39-13M238 250c12-9 28-9 42 0"
          stroke="#2F8F56"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.62"
        />
      </g>

      <g>
        <circle cx="300" cy="274" r="26" fill="#D96354" />
        <path
          d="M300 248c1-11 9-18 20-19-1 11-8 17-20 19Z"
          fill="#4CAF6D"
        />
        <path
          d="M291 269c5-5 13-6 19-1"
          stroke="#B9483E"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      <g>
        <path
          d="M95 299h230l-14 82H109L95 299Z"
          fill="url(#auth-box)"
          stroke="#C48E52"
          strokeWidth="3"
        />
        <path
          d="M95 299h29l-4 82h-11L95 299ZM325 299h-29l4 82h11l14-82Z"
          fill="#C99255"
          opacity="0.5"
        />
        <path
          d="M96 299c18-18 37-28 58-31l11 19c-23 10-46 15-69 12ZM324 299c-18-18-37-28-58-31l-11 19c23 10 46 15 69 12Z"
          fill="#F2CB91"
          stroke="#C48E52"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <g transform="translate(177 325)">
          <path
            d="M20 0 36 28H27l9 16H31l-7-11-7 11H4l9-16h-9L20 0Z"
            fill="#2F8F56"
          />
          <path
            d="M9 24h22M13 34h14"
            stroke="#2F8F56"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
      </g>

      <g fill="#75C98C">
        <path d="m76 116 5 13 13 5-13 5-5 13-5-13-13-5 13-5 5-13Z" />
        <path d="m348 265 4 9 9 4-9 4-4 9-4-9-9-4 9-4 4-9Z" />
        <path d="m338 85 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" />
      </g>
    </svg>
  );
}
