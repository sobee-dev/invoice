import Image from "next/image";

interface LoaderProps {
  /** Covers the whole screen and centers the spinner. Set to false to render inline inside a section. */
  fullScreen?: boolean;
  /** Path to your logo in /public */
  logoSrc?: string;
  /** Outer ring size in px */
  size?: number;
}

const Loader = ({ fullScreen = true, logoSrc = "/logo.png", size = 72 }: LoaderProps) => {
  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Spinning ring */}
      <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#1b2e5e]/15 border-t-[#1b2e5e]" />

      {/* Pulsing logo */}
      <Image
        src={logoSrc}
        alt=""
        width={size}
        height={size}
        priority
        className="animate-logo-pulse h-auto object-contain"
        style={{ width: size * 0.5 }}
      />

      <span className="sr-only">Loading</span>
    </div>
  );

  if (!fullScreen) {
    return <div className="flex items-center justify-center py-12">{spinner}</div>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm">
      {spinner}
    </div>
  );
};

export default Loader;