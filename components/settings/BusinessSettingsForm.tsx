// components/settings/BusinessSettingsForm.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { DEFAULT_CURRENCY, GLOBAL_CURRENCIES } from "@/data/constants";
import { uploadImage } from "@/lib/cloudinaryUpload";
import { BusinessProfile, businessService } from "@/services/business";
import { resolveCurrency } from "@/utils/currencySymbol";
import { SignatureField, SignatureType } from "./SignatureField";
import { Banner, errMsg, Field, inputCls, Section, Toggle } from "./ui";

import { InvoicePreview, TemplateId } from "../onboarding/InvoicePreview";
import { deleteRemovedBrandAssets, useBrandAssets, validateSignature } from "@/hooks/useBrandAssets";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { DEFAULT_TEMPLATE_ID, effectiveTemplateId, isTemplateLocked } from "@/lib/plan";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const BRAND_COLORS = [
  { hex: "#1b2e5e", label: "Navy" },
  { hex: "#c47f17", label: "Amber" },
  { hex: "#c62828", label: "Red" },
  { hex: "#2e7d32", label: "Green" },
  { hex: "#0277bd", label: "Blue" },
  { hex: "#000000", label: "Black" },
  { hex: "#212121", label: "Charcoal" },
  { hex: "#e65100", label: "Orange" },
  { hex: "#ff9800", label: "Tangerine" },
  { hex: "#fbc02d", label: "Yellow" },
  { hex: "#f9a825", label: "Gold" },
];


const TEMPLATES: { id: TemplateId; name: string; badge?: string; badgeClasses?: string }[] = [
  { id: "modern", name: "Modern Corporate", badge: "Recommended", badgeClasses: "bg-secondary-container text-on-secondary-container" },
  { id: "classic", name: "Classic Clean", badge: "Popular", badgeClasses: "bg-[#d4edda] text-[#1a5c2a]" },
  { id: "minimal", name: "Minimal Edge" },
  { id: "professional", name: "Professional", badge: "New", badgeClasses: "bg-[#d4edda] text-[#1a5c2a]" },
];

interface FormState {
  name: string;
  description: string;
  motto: string;
  phone: string;
  email: string;
  addressOne: string;
  addressTwo: string;
  registrationNumber: string;
  logoUrl: string;
  brandColorOne: string;
  currency: string; // currency code
  taxEnabled: boolean;
  taxRate: string; // percent, e.g. "7.5"
  signatureType: SignatureType;
  signatureText: string;
  signatureUrl: string;
  selectedTemplateId: BusinessProfile["selectedTemplateId"];
}

function fromBusiness(b: BusinessProfile, fallbackEmail: string): FormState {
  return {
    name: b.name ?? "",
    description: b.description ?? "",
    motto: b.motto ?? "",
    phone: b.phone ?? "",
    email: b.email || fallbackEmail,
    addressOne: b.addressOne ?? "",
    addressTwo: b.addressTwo ?? "",
    registrationNumber: b.registrationNumber ?? "",
    logoUrl: b.logoUrl ?? "",
    brandColorOne: b.brandColorOne || "#1b2e5e",
    currency: resolveCurrency(b.currency || DEFAULT_CURRENCY.code).code,
    taxEnabled: b.taxEnabled ?? false,
    taxRate: b.taxRate ?? "",
    signatureType: b.signatureType ?? "none",
    signatureText: b.signatureText ?? "",
    signatureUrl: b.signatureUrl ?? "",
    selectedTemplateId: b.selectedTemplateId ?? "classic",
  };
}

export function BusinessSettingsForm() {
  const { user } = useAuth();
  const { business, refreshBusiness } = useBusiness();

  // The owner layout only renders children once the business has loaded.
  const initial = useMemo(() => fromBusiness(business!, user?.email ?? ""), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState<FormState>(initial);
  const [baseline, setBaseline] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const { subscription } = useSubscriptionContext();
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const {
    logoBusy, sigBusy, logoError, sigError,
    handleLogoFile, handleRemoveLogo, handleSignatureDrawn, handleRemoveSignature,
  } = useBrandAssets({
    logoUrl: form.logoUrl,
    signatureUrl: form.signatureUrl,
    deleteMode: 'deferred',
    onLogoChange: (url) => set("logoUrl", url),
    onSignatureChange: (url) => set("signatureUrl", url),
    onSignatureRemoved: () => setForm((f) => ({ ...f, signatureType: "none", signatureUrl: "" })),
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  // Warn on tab close / reload with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const symbol = resolveCurrency(form.currency).symbol;

 

  // ── Save ───────────────────────────────────────────────────────────────────
  function validate(): string | null {
    if (!form.name.trim()) return "Business name cannot be empty.";
    if (!HEX.test(form.brandColorOne)) return "Brand color must be a valid hex code, e.g. #1B2E5E.";
    if (form.taxEnabled) {
      const r = parseFloat(form.taxRate);
      if (!(r > 0 && r <= 100)) return "Tax rate must be greater than 0 and no more than 100 when tax is enabled.";
    }
    const sigProblem = validateSignature(form.signatureType, form.signatureText, form.signatureUrl);
    if (sigProblem) return sigProblem;
    return null;
  }

  async function handleSave() {
    const problem = validate();
    if (problem) return setBanner({ kind: "error", text: problem });
    if (!business) return;

    const next: FormState = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      motto: form.motto.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      addressOne: form.addressOne.trim(),
      addressTwo: form.addressTwo.trim(),
      registrationNumber: form.registrationNumber.trim(),
      taxRate: form.taxEnabled ? form.taxRate : "0",
      signatureText: form.signatureType === "text" ? form.signatureText : "",
      signatureUrl: form.signatureType === "image" ? form.signatureUrl : "",
    };

    setSaving(true);
    setBanner(null);
    try {
      await businessService.updateBusiness(business.id, {
        ...next,
        // A plan that lost template access (a lapsed trial) never sends a locked template back.
        selectedTemplateId: isTemplateLocked(subscription, next.selectedTemplateId) ? DEFAULT_TEMPLATE_ID : next.selectedTemplateId,
        signatureUrl: next.signatureType === "image" ? next.signatureUrl : null,
      });
      await deleteRemovedBrandAssets(baseline, next); // after the save, so Discard stays safe
      await refreshBusiness();
      setForm(next);
      setBaseline(next);
      setBanner({ kind: "success", text: "Business settings saved." });
    } catch (err) {
      setBanner({ kind: "error", text: errMsg(err, "Could not save settings. Please try again.") });
    } finally {
      setSaving(false);
    }
  }

  const colorIsPreset = BRAND_COLORS.some((c) => c.hex.toLowerCase() === form.brandColorOne.toLowerCase());

  return (
    <div className="space-y-6">
      {banner && <Banner kind={banner.kind}>{banner.text}</Banner>}

      {/* Logo */}
      <Section title="Business logo" description="Appears on invoices and in the app header. PNG or JPG, up to 3MB.">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="Business logo" className="h-full w-full object-contain" />
            ) : (
              <Icon name="storefront" size={32} className="text-on-surface-variant" />
            )}
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { handleLogoFile(e.target.files?.[0]); e.target.value = ""; }} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={logoBusy}
              className="h-10 rounded-lg border border-primary-container px-4 text-sm font-semibold text-primary hover:bg-surface-container-low disabled:opacity-50"
            >
              {logoBusy ? "Uploading..." : form.logoUrl ? "Replace logo" : "Upload logo"}
            </button>
            {form.logoUrl && !logoBusy && (
              <button type="button" onClick={handleRemoveLogo} className="h-10 rounded-lg px-3 text-sm font-semibold text-error hover:bg-error-container">
                Remove
              </button>
            )}
          </div>
          
        </div>
        {logoError && <p className="mt-3 text-xs text-error">{logoError}</p>}
      </Section>

      {/* Profile */}
      <Section title="Business profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" className="sm:col-span-2">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your company name" className={inputCls} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="e.g. Importers and exporters of..."
              className={`${inputCls} h-auto py-2.5`}
            />
          </Field>
          <Field label="Motto or tagline">
            <input value={form.motto} onChange={(e) => set("motto", e.target.value)} placeholder="e.g. In God We Trust" className={inputCls} />
          </Field>
          <Field label="Registration number (optional)">
            <input value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} placeholder="RC-12343216" className={inputCls} />
          </Field>
          <Field label="Phone number">
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234 800 000 0000" className={inputCls} />
          </Field>
          <Field label="Email address">
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ops@company.com" className={inputCls} />
          </Field>
          <Field label="Address line 1">
            <input value={form.addressOne} onChange={(e) => set("addressOne", e.target.value)} placeholder="Street address" className={inputCls} />
          </Field>
          <Field label="Address line 2 (optional)">
            <input value={form.addressTwo} onChange={(e) => set("addressTwo", e.target.value)} placeholder="City, state, postal code" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Tax + currency */}
      <Section title="Tax and currency">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Currency" hint={`Invoices will show amounts as ${symbol}1,000.00`}>
            <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputCls}>
              {GLOBAL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} — {c.name} ({c.code})
                </option>
              ))}
            </select>
          </Field>

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-on-surface">Apply tax automatically</p>
                <p className="text-xs text-on-surface-variant">Uses this rate as the default on new invoices.</p>
              </div>
              <Toggle checked={form.taxEnabled} onChange={(v) => set("taxEnabled", v)} label="Apply tax automatically" />
            </div>
            {form.taxEnabled && (
              <div className="mt-3 flex">
                <input
                  inputMode="decimal"
                  value={form.taxRate}
                  onChange={(e) => set("taxRate", e.target.value.replace(/[^0-9.]/g, ""))}
                  aria-label="Default tax rate"
                  placeholder="7.5"
                  className={`${inputCls} rounded-r-none`}
                />
                <span className="flex h-11 items-center rounded-r-lg border border-l-0 border-outline-variant bg-surface-container-low px-4 font-bold text-on-surface-variant">%</span>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Brand color */}
      <Section title="Brand color" description="Used for headers, tables and totals on your invoices.">
        <div className="flex flex-wrap items-center gap-2.5">
          {BRAND_COLORS.map((c) => {
            const active = form.brandColorOne.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                aria-label={c.label}
                aria-pressed={active}
                onClick={() => set("brandColorOne", c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`h-9 w-9 rounded-full ring-offset-2 transition-shadow ${active ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-outline-variant"}`}
              />
            );
          })}
          {HEX.test(form.brandColorOne) && !colorIsPreset && (
            <span aria-label="Custom color" style={{ backgroundColor: form.brandColorOne }} className="h-9 w-9 rounded-full ring-2 ring-primary ring-offset-2" />
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="color"
            aria-label="Pick a custom color"
            value={HEX.test(form.brandColorOne) && form.brandColorOne.length === 7 ? form.brandColorOne : "#1b2e5e"}
            onChange={(e) => set("brandColorOne", e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-lg border border-outline-variant bg-white p-1"
          />
          <input
            value={form.brandColorOne}
            onChange={(e) => {
              let v = e.target.value.trim();
              if (v && !v.startsWith("#")) v = `#${v}`;
              set("brandColorOne", v.slice(0, 7));
            }}
            maxLength={7}
            aria-label="Hex color"
            placeholder="#1B2E5E"
            className={`${inputCls} max-w-[160px] uppercase`}
          />
          {!HEX.test(form.brandColorOne) && <span className="text-xs text-error">Enter a valid hex code.</span>}
        </div>
      </Section>

      {/* Template */}
      <Section title="Invoice template" description="Applies to all customer-facing invoices and quotes. Supplier orders always use their own layout.">
        {TEMPLATES.some((t) => isTemplateLocked(subscription, t.id)) && (
          <p className="mb-4 text-sm text-on-surface-variant">
            The Free plan uses the Classic template.{" "}
            <Link href={ROUTES.billing} className="font-semibold text-primary underline">Upgrade</Link> to choose a different one.
          </p>
        )}
        <div role="radiogroup" aria-label="Invoice template" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((t) => {
            const locked = isTemplateLocked(subscription, t.id);
            const active = effectiveTemplateId(subscription, form.selectedTemplateId) === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={locked}
                onClick={() => { if (!locked) set("selectedTemplateId", t.id); }}
                className={`relative rounded-2xl bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-container/20 ${
                  active
                    ? "border-2 border-primary-container shadow-[0_14px_30px_-14px_rgba(27,46,94,0.45)]"
                    : "border border-outline-variant hover:border-outline"
                } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div className="rounded-xl bg-surface-container-low p-4">
                  <InvoicePreview
                    template={t.id}
                    accent={HEX.test(form.brandColorOne) ? form.brandColorOne : "#1b2e5e"}
                    name={form.name}
                    logoUrl={form.logoUrl}
                    currencySymbol={symbol}
                  />
                </div>

                {active && (
                  <span className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-white shadow">
                    <Icon name="check" size={18} />
                  </span>
                )}
                {locked && (
                  <span className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white text-on-surface-variant shadow">
                    <Icon name="lock" size={18} />
                  </span>
                )}

                <div className="mt-4 space-y-1.5 px-1">
                  {t.badge && !locked && (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${t.badgeClasses}`}>
                      {t.badge}
                    </span>
                  )}
                  <p className="text-xl font-extrabold">{t.name}</p>
                  {locked && <p className="text-xs text-on-surface-variant">Included in paid plans</p>}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Signature */}
      <Section title="Signature" description="Appears on your invoices as proof of authorization.">
        <SignatureField
          type={form.signatureType}
          text={form.signatureText}
          url={form.signatureUrl}
          uploading={sigBusy}
          onTypeChange={(t) => set("signatureType", t)}
          onTextChange={(t) => set("signatureText", t)}
          onDrawn={handleSignatureDrawn}
          onRemoveImage={handleRemoveSignature}
        />
        {sigError && <p className="mt-3 text-xs text-error">{sigError}</p>}
      </Section>

      {/* Sticky save bar, only while there is something to save */}
      {dirty && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-white px-5 py-3 shadow-card">
          <p className="text-sm font-medium text-on-surface">You have unsaved changes.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(baseline)}
              disabled={saving}
              className="h-10 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || logoBusy || sigBusy}
              className="h-10 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}