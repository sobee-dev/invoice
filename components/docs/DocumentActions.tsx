// components/docs/DocumentActions.tsx
"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { btnAmber, btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import type { ShareKind, ShareSlot, ShareSlots } from "@/hooks/useInvoiceShare";
import { useShareSheet } from "@/hooks/useShareSheet";
import { canShareFile } from "@/lib/shareFile";

export interface StatusAction {
  id: string;
  label: string;
  shortLabel: string; // for the narrow phone bar
  icon: string;
  onClick: () => void;
}

export interface DeductInfo {
  canDeduct: boolean;
  loading: boolean;
  onClick: () => void;
  note: string | null;
}

export interface DocumentActionsProps {
  statusActions: StatusAction[]; // first is the primary action, second (if any) is outlined
  slots: ShareSlots;
  onShare: (kind: ShareKind) => void;
  shareDisabled: boolean;
  onPrint: () => void;
  printing: boolean;
  printDisabled: boolean;
  editHref: string;
  editBlocked: string | null;
  paymentsHref: string | null;
  deduct: DeductInfo | null;
}

const KINDS: ShareKind[] = ["pdf", "image"];

const SHARE_META: Record<ShareKind, { name: string; tile: string; icon: string }> = {
  pdf: { name: "PDF", tile: "PDF", icon: "picture_as_pdf" },
  image: { name: "image", tile: "Image", icon: "image" },
};

const TILE =
  "min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center text-xs font-semibold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const TILE_IDLE = "border-outline-variant bg-white text-primary hover:bg-surface-container-low";
const TILE_READY = "border-primary-container bg-primary-fixed text-primary-container";
const ROW =
  "flex w-full items-center gap-3 border-t border-outline-variant/60 px-1 py-3 text-left text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low/60 disabled:opacity-50";

const isReady = (slot: ShareSlot, touch: boolean) => slot.status === "ready" && touch && canShareFile(slot.file);

function shareLabel(kind: ShareKind, slot: ShareSlot, touch: boolean, style: "tile" | "button"): string {
  const { name, tile } = SHARE_META[kind];
  const ready = isReady(slot, touch);

  if (style === "tile") {
    if (slot.status === "preparing") return "Preparing";
    if (slot.status === "error") return "Retry";
    return ready ? "Tap to share" : tile;
  }
  if (slot.status === "preparing") return `Preparing ${name}...`;
  if (slot.status === "error") return `Try ${name} again`;
  if (ready) return `Tap to share ${name}`;
  return touch ? `Share ${name}` : `Download ${name}`;
}

function shareError(slots: ShareSlots): string | null {
  for (const k of KINDS) {
    const s = slots[k];
    if (s.status === "error") return s.message;
  }
  return null;
}

function shareStatus(slots: ShareSlots, touch: boolean): { tone: "info" | "error"; text: string } | null {
  const error = shareError(slots);
  if (error) return { tone: "error", text: error };

  for (const k of KINDS) {
    if (slots[k].status === "preparing") {
      return { tone: "info", text: `Creating your ${SHARE_META[k].name}. This can take up to 10 seconds.` };
    }
  }
  for (const k of KINDS) {
    if (isReady(slots[k], touch)) {
      return { tone: "info", text: `Your ${SHARE_META[k].name} is ready. Tap it again to share.` };
    }
  }
  return null;
}

// Only one file is built at a time, so a second tap can't start a second browser.
function useShareState(p: DocumentActionsProps) {
  const touch = useShareSheet();
  const busy = KINDS.some((k) => p.slots[k].status === "preparing");
  const disabledFor = (k: ShareKind) => p.shareDisabled || (busy && p.slots[k].status !== "preparing");
  return { touch, disabledFor };
}

interface ShareButtonProps {
  kind: ShareKind;
  slot: ShareSlot;
  touch: boolean;
  disabled: boolean;
  onShare: (kind: ShareKind) => void;
  className: string;
  label: "tile" | "button";
  icon?: string;
}

function ShareButton({ kind, slot, touch, disabled, onShare, className, label, icon }: ShareButtonProps) {
  const preparing = slot.status === "preparing";
  const idleIcon = slot.status === "error" ? "refresh" : (icon ?? SHARE_META[kind].icon);
  return (
    <button type="button" onClick={() => onShare(kind)} disabled={disabled} aria-busy={preparing} className={className}>
      <Icon name={preparing ? "progress_activity" : idleIcon} size={label === "tile" ? 20 : 18} className={preparing ? "animate-spin" : ""} />
      {shareLabel(kind, slot, touch, label)}
    </button>
  );
}

// ── Actions card (sidebar on wide screens, under the preview on small ones) ──
export function DocumentActionsCard(p: DocumentActionsProps) {
  const { touch, disabledFor } = useShareState(p);
  const [primary, secondary] = p.statusActions;
  const promoted = !primary; // nothing to change, so sharing leads
  const status = shareStatus(p.slots, touch);
  const hasRows = Boolean(p.paymentsHref || p.deduct);

  const tileClass = (k: ShareKind) => `${TILE} flex ${isReady(p.slots[k], touch) ? TILE_READY : TILE_IDLE}`;

  return (
    <div className="space-y-3">
      {primary ? (
        <button type="button" onClick={primary.onClick} className={`${btnAmber} h-11 w-full`}>
          <Icon name={primary.icon} size={18} /> {primary.label}
        </button>
      ) : (
        <ShareButton
          kind="pdf"
          slot={p.slots.pdf}
          touch={touch}
          disabled={disabledFor("pdf")}
          onShare={p.onShare}
          className={`${btnAmber} h-11 w-full`}
          label="button"
        />
      )}

      {secondary && (
        <button type="button" onClick={secondary.onClick} className={`${btnOutline} h-11 w-full`}>
          <Icon name={secondary.icon} size={18} /> {secondary.label}
        </button>
      )}

      <div className="flex gap-2">
        {!promoted && (
          <ShareButton
            kind="pdf"
            slot={p.slots.pdf}
            touch={touch}
            disabled={disabledFor("pdf")}
            onShare={p.onShare}
            className={tileClass("pdf")}
            label="tile"
          />
        )}
        <ShareButton
          kind="image"
          slot={p.slots.image}
          touch={touch}
          disabled={disabledFor("image")}
          onShare={p.onShare}
          className={tileClass("image")}
          label="tile"
        />

        {/* Print dialogs don't work on phones, so this tile is desktop only. */}
        <button type="button" onClick={p.onPrint} disabled={p.printDisabled} className={`${TILE} hidden md:flex ${TILE_IDLE}`}>
          <Icon name={p.printing ? "progress_activity" : "print"} size={20} className={p.printing ? "animate-spin" : ""} />
          {p.printing ? "Opening" : "Print"}
        </button>

        {p.editBlocked ? (
          <button type="button" disabled className={`${TILE} flex ${TILE_IDLE}`}>
            <Icon name="edit" size={20} />
            Edit
          </button>
        ) : (
          <Link href={p.editHref} className={`${TILE} flex ${TILE_IDLE}`}>
            <Icon name="edit" size={20} />
            Edit
          </Link>
        )}
      </div>

      {status && (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={`text-xs ${status.tone === "error" ? "text-error" : "text-on-surface-variant"}`}
        >
          {status.text}
        </p>
      )}
      {p.editBlocked && <p className="text-xs text-on-surface-variant">{p.editBlocked}</p>}

      {hasRows && (
        <div>
          {p.paymentsHref && (
            <Link href={p.paymentsHref} className={ROW}>
              <Icon name="history" size={20} className="text-on-surface-variant" />
              <span className="flex-1">View payment history</span>
              <Icon name="chevron_right" size={18} className="text-on-surface-variant" />
            </Link>
          )}
          {p.deduct?.canDeduct && (
            <button type="button" onClick={p.deduct.onClick} disabled={p.deduct.loading} className={ROW}>
              <Icon name="inventory_2" size={20} className="text-on-surface-variant" />
              <span className="flex-1">{p.deduct.loading ? "Loading stock..." : "Deduct stock"}</span>
              <Icon name="chevron_right" size={18} className="text-on-surface-variant" />
            </button>
          )}
          {p.deduct?.note && (
            <p className="border-t border-outline-variant/60 px-1 py-3 text-xs text-on-surface-variant">{p.deduct.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sticky bar for phones and small tablets ─────────────────────────────────
export function DocumentActionsBar(p: DocumentActionsProps) {
  const { touch, disabledFor } = useShareState(p);
  const [primary] = p.statusActions;
  const error = shareError(p.slots);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-white/95 px-3 pt-3 shadow-modal backdrop-blur lg:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {error && (
        <p role="alert" className="mx-auto mb-2 max-w-xl text-xs text-error">
          {error}
        </p>
      )}
      <div className="mx-auto flex max-w-xl gap-2">
        {primary ? (
          <>
            <button type="button" onClick={primary.onClick} className={`${btnAmber} h-11 min-w-0 flex-1`}>
              <Icon name={primary.icon} size={18} />
              <span className="truncate">{primary.shortLabel}</span>
            </button>
            <ShareButton
              kind="pdf"
              slot={p.slots.pdf}
              touch={touch}
              disabled={disabledFor("pdf")}
              onShare={p.onShare}
              className={`${btnNavy} h-11 shrink-0 px-3`}
              label="tile"
              icon="share"
            />
          </>
        ) : (
          <>
            <ShareButton
              kind="pdf"
              slot={p.slots.pdf}
              touch={touch}
              disabled={disabledFor("pdf")}
              onShare={p.onShare}
              className={`${btnAmber} h-11 min-w-0 flex-1`}
              label="button"
            />
            <ShareButton
              kind="image"
              slot={p.slots.image}
              touch={touch}
              disabled={disabledFor("image")}
              onShare={p.onShare}
              className={`${btnOutline} h-11 shrink-0 px-3`}
              label="tile"
              icon="share"
            />
          </>
        )}
      </div>
    </div>
  );
}