// components/clients/ClientForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { btnNavy, btnOutline, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { PAYMENT_OPTIONS, TAG_SUGGESTIONS } from "@/lib/customers";
import { Customer, customerService } from "@/services/customers";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ClientForm({ client }: { client?: Customer }) {
  const router = useRouter();
  const isEdit = Boolean(client);

  const [fullName, setFullName] = useState(client?.fullName ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [payment, setPayment] = useState<string>(client?.paymentMethodPreference ?? "cash");
  const [tags, setTags] = useState<string[]>(client?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().slice(0, 30);
    if (!tag) return;
    setTags((prev) => (prev.some((t) => t.toLowerCase() === tag.toLowerCase()) ? prev : [...prev, tag]));
  };

  const suggestions = TAG_SUGGESTIONS.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!fullName.trim()) return setError("Enter the client's full name.");
    if (email.trim() && !EMAIL.test(email.trim())) return setError("Enter a valid email address, or leave it blank.");

    setSaving(true);
    setError("");

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      paymentMethodPreference: payment,
      tags,
      notes: notes.trim(),
    };

    try {
      const saved = client ? await customerService.update(client.id, payload) : await customerService.create(payload);
      router.replace(`/clients/${saved?.id ?? client?.id}`);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not save this client. Please try again."));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-[#f9b4ae] bg-error-container p-4 text-body-md text-error">
          {error}
        </div>
      )}

      <SectionCard title="Basic details">
        <div className="space-y-5">
          <div>
            <label htmlFor="c-name" className={labelClasses}>Full name</label>
            <input
              id="c-name"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(""); }}
              disabled={saving}
              placeholder="For example: Jonathan Sterling"
              className={`${inputClasses} h-11`}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="c-email" className={labelClasses}>Email address</label>
              <input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                disabled={saving}
                autoCapitalize="none"
                className={`${inputClasses} h-11`}
              />
            </div>
            <div>
              <label htmlFor="c-phone" className={labelClasses}>Phone number</label>
              <input
                id="c-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={saving}
                className={`${inputClasses} h-11`}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Payment preference">
        <label htmlFor="c-payment" className={labelClasses}>How they usually pay</label>
        <select
          id="c-payment"
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          disabled={saving}
          className={`${inputClasses} h-11`}
        >
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </SectionCard>

      <SectionCard title="Tags">
        {tags.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="flex items-center gap-1 rounded-full bg-surface-container py-1 pl-3 pr-1 text-sm font-semibold text-on-surface">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface-container-high"
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagDraft);
                setTagDraft("");
              }
            }}
            maxLength={30}
            placeholder="Add your own tag"
            aria-label="Add your own tag"
            disabled={saving}
            className={`${inputClasses} h-11`}
          />
          <button
            type="button"
            onClick={() => { addTag(tagDraft); setTagDraft(""); }}
            disabled={saving || !tagDraft.trim()}
            className={btnOutline}
          >
            Add
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Suggestions</p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => addTag(s)}
                    disabled={saving}
                    className="rounded-full border border-primary-container/30 bg-primary-container/10 px-3 py-1 text-sm font-semibold text-primary-container hover:bg-primary-container/15"
                  >
                    + {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Notes">
        <label htmlFor="c-notes" className={labelClasses}>Anything worth remembering about this client</label>
        <textarea
          id="c-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
          className={`${inputClasses} py-3`}
        />
      </SectionCard>

      <div className="flex justify-end gap-3">
        <Link href={client ? `/clients/${client.id}` : "/clients"} className={btnOutline}>
          Cancel
        </Link>
        <button type="submit" disabled={saving} className={`${btnNavy} min-w-40`}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create client"}
        </button>
      </div>
    </form>
  );
}