// hooks/useGlobalSearch.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentType, TYPE_LABEL } from "@/lib/documents";
import { ROUTES } from "@/lib/routes";
import { customerService } from "@/services/customers";
import { documentService } from "@/services/documents";
import { productService } from "@/services/products";
import { StaffMember, staffService } from "@/services/staff";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtMoney } from "@/utils/money";

export type SearchGroup = "Quick links" | "Pages" | "Documents" | "Clients" | "Products" | "Team" | "More";

export interface SearchHit {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
}

export interface SearchResultGroup {
  group: SearchGroup;
  hits: SearchHit[];
}

const MIN_CHARS = 2;
const PER_GROUP = 5;

const DOC_ICON: Record<DocumentType, string> = {
  sales_invoice: "receipt_long",
  proforma_invoice: "description",
  purchase_invoice: "inventory",
};

// The team list has no search filter, so it is fetched once and filtered here.
let staffPromise: Promise<StaffMember[]> | null = null;
function loadStaff(): Promise<StaffMember[]> {
  if (!staffPromise) {
    staffPromise = staffService.list().catch((err) => {
      staffPromise = null; // try again next time
      throw err;
    });
  }
  return staffPromise;
}

const includes = (value: string | undefined | null, q: string) => (value ?? "").toLowerCase().includes(q);

// Looks in documents, clients, products and the team. Pass the debounced term.
export function useGlobalSearch(term: string, enabled: boolean) {
  const query = term.trim();
  const [remote, setRemote] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    if (!enabled || query.length < MIN_CHARS) {
      latest.current += 1;
      setRemote([]);
      setLoading(false);
      return;
    }

    const request = ++latest.current;
    setLoading(true);

    (async () => {
      // Each source fails on its own, so one slow or broken endpoint never hides the others.
      const [docs, clients, products, staff] = await Promise.allSettled([
        documentService.list({ search: query, ordering: "-document_date", page: 1 }),
        customerService.search(query),
        productService.search(query),
        loadStaff(),
      ]);
      if (request !== latest.current) return;

      const groups: SearchResultGroup[] = [];

      if (docs.status === "fulfilled") {
        const value: any = docs.value;
        const rows: any[] = Array.isArray(value) ? value : value?.results ?? [];
        const hits = rows.slice(0, PER_GROUP).map((d): SearchHit => {
          const symbol = resolveCurrency(d.currency || "").symbol;
          const who = d.customerName || d.supplierName || "No name";
          return {
            id: `doc-${d.id}`,
            title: d.documentNumber,
            subtitle: `${TYPE_LABEL[d.documentType as DocumentType] ?? d.documentType} · ${who} · ${fmtMoney(Number(d.grandTotal) || 0, symbol, 2)}`,
            icon: DOC_ICON[d.documentType as DocumentType] ?? "description",
            href: `${ROUTES.docs}/${d.id}`,
          };
        });
        if (hits.length) groups.push({ group: "Documents", hits });
      }

      if (clients.status === "fulfilled") {
        const hits = clients.value.slice(0, PER_GROUP).map(
          (c): SearchHit => ({
            id: `client-${c.id}`,
            title: c.fullName,
            subtitle: c.email || c.phone || undefined,
            icon: "person",
            href: `${ROUTES.clients}/${c.id}`,
          }),
        );
        if (hits.length) groups.push({ group: "Clients", hits });
      }

      if (products.status === "fulfilled") {
        const hits = products.value.slice(0, PER_GROUP).map(
          (p): SearchHit => ({
            id: `product-${p.id}`,
            title: p.name,
            subtitle: `SKU ${p.sku || "none"} · ${Number(p.quantityOnHand)} in stock`,
            icon: "inventory_2",
            href: `${ROUTES.products}/${p.id}`,
          }),
        );
        if (hits.length) groups.push({ group: "Products", hits });
      }

      if (staff.status === "fulfilled") {
        const q = query.toLowerCase();
        const hits = staff.value
          .filter((m) => includes(m.fullName, q) || includes(m.email, q) || includes(m.department, q))
          .slice(0, PER_GROUP)
          .map(
            (m): SearchHit => ({
              id: `team-${m.id}`,
              title: m.fullName || m.email,
              subtitle: `${m.email}${m.department ? ` · ${m.department}` : ""}`,
              icon: "badge",
              href: ROUTES.team,
            }),
          );
        if (hits.length) groups.push({ group: "Team", hits });
      }

      groups.push({
        group: "More",
        hits: [
          {
            id: "more-docs",
            title: `Search all documents for "${query}"`,
            icon: "manage_search",
            href: `${ROUTES.docs}?search=${encodeURIComponent(query)}`,
          },
        ],
      });

      setRemote(groups);
      setLoading(false);
    })();
  }, [query, enabled]);

  return { remote, loading };
}