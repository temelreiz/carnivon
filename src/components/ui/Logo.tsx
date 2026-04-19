export function LogoMark({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="Carnivon"
      className={className}
    >
      <defs>
        <linearGradient id="lm-horn" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e9c671" />
          <stop offset="0.45" stopColor="#c89a3f" />
          <stop offset="1" stopColor="#8a6528" />
        </linearGradient>
        <linearGradient id="lm-core" x1="60" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f4dc92" />
          <stop offset="0.6" stopColor="#c89a3f" />
          <stop offset="1" stopColor="#6b4a1c" />
        </linearGradient>
      </defs>
      <path
        d="M60 40 C 40 30, 18 34, 8 44 C 24 42, 38 48, 50 58 C 44 52, 40 46, 38 40 C 40 44, 46 48, 54 50 L 60 44 Z"
        fill="url(#lm-horn)"
      />
      <path
        d="M60 40 C 80 30, 102 34, 112 44 C 96 42, 82 48, 70 58 C 76 52, 80 46, 82 40 C 80 44, 74 48, 66 50 L 60 44 Z"
        fill="url(#lm-horn)"
      />
      <path
        d="M60 22 L 72 38 L 68 38 L 68 58 L 72 58 L 60 98 L 48 58 L 52 58 L 52 38 L 48 38 Z"
        fill="url(#lm-core)"
      />
      <path d="M60 26 L 66 36 L 54 36 Z" fill="#f4dc92" />
      <path d="M38 56 L 50 70 L 48 76 L 34 62 Z" fill="url(#lm-horn)" />
      <path d="M82 56 L 70 70 L 72 76 L 86 62 Z" fill="url(#lm-horn)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-serif tracking-[0.3em] uppercase bg-gradient-to-br from-[#e9c671] via-[#c89a3f] to-[#8a6528] bg-clip-text text-transparent ${className}`}
    >
      Carnivon
    </span>
  );
}
