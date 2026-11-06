// components/layout/Icon.tsx
interface IconProps {
  name: string; // a Material Symbols name such as "payments"
  size?: number;
  filled?: boolean;
  className?: string;
}

export function Icon({ name, size = 24, filled = false, className = "" }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined shrink-0 overflow-hidden ${className}`}
      style={{
        fontSize: size,
        width: size,
        height: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400`,
      }}
    >
      {name}
    </span>
  );
}