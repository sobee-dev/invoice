// components/ui/Avatar.tsx
import { initials } from "@/utils/money";

const TONES = [
  "bg-primary-fixed text-light-blue",
  "bg-secondary-fixed text-secondary",
  "bg-surface-container text-on-surface-variant",
  "bg-tertiary-fixed text-on-tertiary-fixed-variant",
];

// The same name always gets the same color.
function toneFor(name: string): string {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return TONES[sum % TONES.length];
}

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, imageUrl, size = 40, className = "" }: AvatarProps) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${toneFor(name)} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials(name)}
    </span>
  );
}