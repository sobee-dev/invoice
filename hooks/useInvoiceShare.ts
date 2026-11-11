// hooks/useInvoiceShare.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchInvoiceFile } from "@/lib/invoiceFile";
import { canShareFile, shareOrDownload, ShareResult } from "@/lib/shareFile";

export type ShareKind = "pdf" | "image";

export type ShareSlot =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "ready"; file: File }
  | { status: "error"; message: string };

export type ShareSlots = Record<ShareKind, ShareSlot>;

const initial = (): ShareSlots => ({ pdf: { status: "idle" }, image: { status: "idle" } });

export type RunOutcome = ShareResult | "prepared" | "error" | "busy" | "stale";

export function useInvoiceShare(html: string, baseName: string | undefined) {
  const [slots, setSlots] = useState<ShareSlots>(initial);
  const generation = useRef(0);

  // A changed invoice means any file we hold is out of date.
  useEffect(() => {
    generation.current += 1;
    setSlots(initial());
  }, [html, baseName]);

  const setSlot = (kind: ShareKind, slot: ShareSlot) => setSlots((prev) => ({ ...prev, [kind]: slot }));

  const run = useCallback(
    async (kind: ShareKind, title: string): Promise<RunOutcome> => {
      const slot = slots[kind];
      if (slot.status === "preparing") return "busy";

      // Second tap: the file is already in hand, so share straight away.
      // Nothing is awaited before this call, which keeps the tap's permission valid.
      if (slot.status === "ready") return shareOrDownload(slot.file, title);

      if (!html || !baseName) return "busy";

      const gen = generation.current;
      setSlot(kind, { status: "preparing" });
      try {
        const safeName = baseName.replace(/[^\w.\- ]/g, "_");
        const file = await fetchInvoiceFile(html, kind, safeName);
        if (gen !== generation.current) return "stale"; // the invoice changed while we waited

        setSlot(kind, { status: "ready", file });
        if (canShareFile(file)) return "prepared"; // phones: wait for the second tap

        return shareOrDownload(file, title); // desktops: download right away
      } catch (err) {
        if (gen === generation.current) {
          setSlot(kind, {
            status: "error",
            message: err instanceof Error ? err.message : "Could not create the file. Please try again.",
          });
        }
        return "error";
      }
    },
    [slots, html, baseName],
  );

  return { slots, run };
}