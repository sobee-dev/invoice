// components/clients/ClientProfileCard.tsx
import type { ReactNode } from "react";
import { Icon } from "@/components/layout/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { paymentLabel } from "@/lib/customers";
import type { Customer } from "@/services/customers";

const TAG_TONES = [
  "bg-primary-fixed text-light-blue",
  "bg-status-draft-bg text-status-draft-fg",
  "bg-secondary-container text-on-secondary-container",
];

function ContactRow({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <div className="truncate text-body-md font-semibold text-on-surface">{children}</div>
      </div>
    </div>
  );
}

export function ClientProfileCard({ client, footer }: { client: Customer; footer?: ReactNode }) {
  const created = new Date(client.createdAt);
  const since = Number.isNaN(created.getTime())
    ? null
    : created.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
      <div className="flex flex-col items-center text-center">
        <Avatar name={client.fullName} size={96} />
        <h2 className="mt-4 break-words text-xl font-bold text-primary">{client.fullName}</h2>
        {since && <p className="text-body-md text-on-surface-variant">Client since {since}</p>}
        <div className="mt-3">
          <Badge tone={client.status === "active" ? "green" : "neutral"}>
            {client.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <ContactRow icon="mail" label="Email">
          {client.email ? (
            <a href={`mailto:${client.email}`} className="hover:underline">
              {client.email}
            </a>
          ) : (
            "—"
          )}
        </ContactRow>
        <ContactRow icon="call" label="Phone">
          {client.phone ? (
            <a href={`tel:${client.phone}`} className="hover:underline">
              {client.phone}
            </a>
          ) : (
            "—"
          )}
        </ContactRow>
        <ContactRow icon="payments" label="Prefers to pay by">
          {paymentLabel(client.paymentMethodPreference)}
        </ContactRow>
      </div>

      {client.tags.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Tags</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {client.tags.map((tag, i) => (
              <li key={tag} className={`rounded-full px-3 py-1 text-xs font-bold ${TAG_TONES[i % TAG_TONES.length]}`}>
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {footer && <div className="mt-6 border-t border-outline-variant pt-5">{footer}</div>}
    </section>
  );
}