"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/layout/Icon";

export interface RowMenuItem {
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface RowMenuProps {
  items: RowMenuItem[];
  /** Screen reader name for the trigger button, for example "Actions for Jane Doe". */
  label?: string;
  /** Accepted so existing callers still compile. The menu now flips on its own. */
  openUp?: boolean;
}

const GAP = 4;
const MARGIN = 8;

export function RowMenu({ items, label = "Row actions" }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  // Measure the real menu, then place it below the button, or above it
  // when there is not enough room below. Coordinates are viewport based
  // because the menu is position: fixed.
  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const t = trigger.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const spaceBelow = window.innerHeight - t.bottom - MARGIN;
    const spaceAbove = t.top - MARGIN;
    const flipUp = m.height > spaceBelow && spaceAbove > spaceBelow;

    const top = flipUp
      ? Math.max(MARGIN, t.top - m.height - GAP)
      : Math.min(t.bottom + GAP, window.innerHeight - m.height - MARGIN);
    const left = Math.min(
      Math.max(MARGIN, t.right - m.width),
      window.innerWidth - m.width - MARGIN,
    );
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    // Any scroll (including inside the table wrapper) would leave a fixed
    // menu floating away from its row, so close it instead.
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  const itemCls = (danger?: boolean, disabled?: boolean) =>
    `flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
      danger ? "text-error hover:bg-error-container" : "text-on-surface hover:bg-surface-container-low"
    } ${disabled ? "pointer-events-none opacity-50" : ""}`;

  const content = (item: RowMenuItem) => (
    <>
      {item.icon && <Icon name={item.icon} size={18} />}
      {item.label}
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
      >
        <Icon name="more_vert" size={20} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              // Invisible for the one frame it takes to measure and place it.
              visibility: pos ? "visible" : "hidden",
            }}
            className="z-[60] w-52 rounded-lg border border-outline-variant bg-white py-1 shadow-modal"
          >
            {items.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  onClick={close}
                  className={itemCls(item.danger, item.disabled)}
                >
                  {content(item)}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    close();
                    item.onClick?.();
                  }}
                  className={itemCls(item.danger, item.disabled)}
                >
                  {content(item)}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}