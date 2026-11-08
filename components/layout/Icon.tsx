// components/layout/Icon.tsx
import type { CSSProperties } from "react";

interface IconProps {
  name: string; // a Material Symbols name such as "payments"
  size?: number;
  mobileSize?: number; // optional size below 640px; omit to keep `size`
  filled?: boolean;
  className?: string;
}

// With mobileSize the sizes go through CSS variables, and a `max-sm:!` class swaps them on phones.
// The `!` is needed because fontSize/width/height are set inline.
const MOBILE_SIZE =
  "max-sm:![font-size:var(--icon-mobile)] max-sm:![width:var(--icon-mobile)] max-sm:![height:var(--icon-mobile)]";

export function Icon({ name, size = 24, mobileSize, filled = false, className = "" }: IconProps) {
  const style = {
    fontSize: size,
    width: size,
    height: size,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400`,
    ...(mobileSize ? { "--icon-mobile": `${mobileSize}px` } : {}),
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined shrink-0 overflow-hidden ${mobileSize ? MOBILE_SIZE : ""} ${className}`}
      style={style}
    >
      {name}
    </span>
  );
}