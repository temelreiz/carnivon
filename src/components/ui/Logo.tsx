import Image from "next/image";

/**
 * Logo source: public/logo.png (1024x1024, black bg, gold mark + wordmark).
 *
 * The full lockup fills ~centered square with:
 *   - mark (horns + arrow)  ~ x:33%..67%, y:27%..56%
 *   - wordmark "CARNIVON"   ~ x:18%..82%, y:59%..72%
 *
 * Two presentations:
 *   <LogoMark/>  — crops to mark-only using background-position
 *   <LogoFull/>  — full lockup as <Image>
 */

export function LogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  // Mark region inside source: x ≈ 33%..67% (width 34%), y ≈ 27%..56% (height 29%)
  // Render as a fixed square; use background-image with positioned sprite math.
  // Source dims 1024x1024 → mark box ≈ 348px wide, 300px tall at (338, 276).
  // Scale background so that the mark box = `size × size` rendered.
  const scale = size / 348; // 1 "mark pixel" = scale CSS pixels
  const bgW = 1024 * scale;
  const bgH = 1024 * scale;
  const bgX = -338 * scale;
  const bgY = -276 * scale;

  return (
    <span
      role="img"
      aria-label="Carnivon"
      className={`inline-block ${className}`}
      style={{
        width: size,
        height: size * (300 / 348), // preserve aspect
        backgroundImage: "url(/logo.png)",
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: "no-repeat",
        // Drop the black padding from the source PNG so the mark blends with the page
        mixBlendMode: "screen",
      }}
    />
  );
}

export function LogoFull({
  width = 220,
  height = 105,
  priority = false,
  className = "",
}: {
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      width={width}
      height={height}
      alt="Carnivon"
      priority={priority}
      className={className}
      // Source PNG has a black background; screen blend drops the black so
      // the gold mark sits directly on the page background.
      style={{ objectFit: "contain", mixBlendMode: "screen" }}
    />
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
