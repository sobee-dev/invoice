// components/layout/GlobalSearch.tsx
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDismiss } from "@/hooks/useDismiss";
import { SearchHit, SearchResultGroup, useGlobalSearch } from "@/hooks/useGlobalSearch";
import { ROUTES } from "@/lib/routes";
import { matchPages, PageEntry, quickPages } from "@/lib/searchPages";

const toHit = (e: PageEntry): SearchHit => ({ id: `page-${e.href}`, title: e.title, icon: e.icon, href: e.href });

export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, 250);
  const { remote, loading } = useGlobalSearch(debounced, true);

  useDismiss(wrapRef, open, () => setOpen(false));

  const groups = useMemo<SearchResultGroup[]>(() => {
    if (!trimmed) return [{ group: "Quick links", hits: quickPages().map(toHit) }];

    const list: SearchResultGroup[] = [];
    const pages = matchPages(trimmed).map(toHit);
    if (pages.length) list.push({ group: "Pages", hits: pages });
    // Remote results belong to the debounced term. Hide them while the text is still changing.
    if (debounced === trimmed) list.push(...remote);
    return list;
  }, [trimmed, debounced, remote]);

  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);
  const signature = flat.map((h) => h.id).join("|");

  useEffect(() => {
    setActive(0);
  }, [signature]);

  // Ctrl or Cmd with K focuses the box from anywhere. A plain slash does too, unless the person is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close and clear after any navigation.
  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  const go = (hit: SearchHit) => {
    router.push(hit.href);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[active];
      if (hit) go(hit);
      else if (trimmed) router.push(`${ROUTES.docs}?search=${encodeURIComponent(trimmed)}`);
    } else if (e.key === "Escape") {
      if (open) setOpen(false);
      else setQuery("");
    }
  };

  const showPanel = open && (flat.length > 0 || loading || trimmed.length > 0);
  const noResults = trimmed.length >= 2 && !loading && debounced === trimmed && !groups.some((g) => g.hits.length > 0 && g.group !== "More");

  let position = -1;

  return (
    <div ref={wrapRef} className="relative mx-auto hidden w-full max-w-xl md:block">
      <Icon
        name="search"
        size={22}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search documents, clients, products and pages"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={showPanel && flat[active] ? `${listId}-opt-${active}` : undefined}
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search documents, clients, products..."
        className="h-11 w-full rounded-xl bg-surface-container-low pl-11 pr-16 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container/30"
      />
      {!query && !open && (
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-outline-variant bg-white px-1.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
          Ctrl K
        </kbd>
      )}

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-outline-variant bg-white py-2 shadow-lg"
        >
          {groups.map((g) => (
            <div key={g.group}>
              <div role="presentation" className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {g.group}
              </div>
              {g.hits.map((hit) => {
                position += 1;
                const index = position;
                return (
                  <div
                    key={hit.id}
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={index === active}
                    // mousedown, not click, so the input keeps focus until we navigate
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(hit);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${index === active ? "bg-surface-container-low" : ""}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary-container">
                      <Icon name={hit.icon} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-md font-semibold text-on-surface">{hit.title}</span>
                      {hit.subtitle && <span className="block truncate text-xs text-on-surface-variant">{hit.subtitle}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {loading && (
            <div role="presentation" className="px-4 py-3 text-xs text-on-surface-variant">
              Searching...
            </div>
          )}

          {noResults && (
            <div role="presentation" className="px-4 py-3 text-body-md text-on-surface-variant">
              Nothing found for "{trimmed}". Check the spelling, or try a document number, a client name or a product.
            </div>
          )}
        </div>
      )}
    </div>
  );
}