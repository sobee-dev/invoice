// lib/shareFile.ts
export type ShareResult = "shared" | "downloaded" | "cancelled";

// Share sheets are for touch devices. Desktops get a normal download.
export function prefersShareSheet(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    window.matchMedia?.("(pointer: coarse)").matches === true
  );
}

export function canShareFile(file: File): boolean {
  return prefersShareSheet() && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
}

export async function shareOrDownload(file: File, title: string): Promise<ShareResult> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "cancelled";
      // Any other failure falls through to a normal download.
    }
  }

  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}