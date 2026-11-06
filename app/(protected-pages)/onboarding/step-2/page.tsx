'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/layout/Icon';
import { ErrorBanner, Field, Segmented, Spinner, Toggle, inputCls } from '@/components/onboarding/bits';
import { useOnboardingDraft } from '@/components/onboarding/OnboardingProvider';

import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { btnNavy, btnOutline } from '@/components/ui/buttonStyles';
import { DEFAULT_CURRENCY, GLOBAL_CURRENCIES, type Currency } from '@/data/constants';
// import { deleteCloudinaryAsset, uploadImage } from '@/lib/cloudinaryUpload';
import { ROUTES } from '@/lib/routes';
import { businessService, type BusinessProfile } from '@/services/business';
import { resolveCurrency } from '@/utils/currencySymbol';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { SignatureField } from '@/components/settings/SignatureField';
import { SignatureType, useBrandAssets, validateSignature } from '@/hooks/useBrandAssets';

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const BRAND_COLORS = [
  { hex: '#1b2e5e', label: 'Navy' },
  { hex: '#c47f17', label: 'Amber' },
  { hex: '#c62828', label: 'Red' },
  { hex: '#2e7d32', label: 'Green' },
  { hex: '#0277bd', label: 'Blue' },
  { hex: '#000000', label: 'Black' },
  { hex: '#212121', label: 'Charcoal' },
  { hex: '#e65100', label: 'Orange' },
  { hex: '#ff9800', label: 'Tangerine' },
  { hex: '#fbc02d', label: 'Yellow' },
  { hex: '#f9a825', label: 'Gold' },
];


const normalizeHex = (hex: string) => hex.trim().toLowerCase();

/** Hex entry: applies the colour the moment it is a valid 3 or 6 digit hex, no confirm step. */
function CustomColorInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  const isValid = HEX_PATTERN.test(draft);

  function handleChange(text: string) {
    let next = text.trim();
    if (next && !next.startsWith('#')) next = `#${next}`;
    next = next.slice(0, 7);
    setDraft(next);
    if (HEX_PATTERN.test(next)) onChange(next);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="h-12 w-12 shrink-0 rounded-xl border border-outline-variant"
          style={{ background: isValid ? draft : '#eceef3' }}
        />
        <input
          className={`${inputCls} ${isValid ? '!border-primary-container' : ''}`}
          value={draft}
          onChange={e => handleChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          spellCheck={false}
          autoFocus
          aria-label="Hex colour code"
        />
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">
        {isValid ? 'This color is applied automatically.' : 'Enter a valid hex code, e.g. #1B2E5E'}
      </p>
    </div>
  );
}

export default function OnboardingStep2() {
  const router = useRouter();
  const { setDraft } = useOnboardingDraft();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [chargeTax, setChargeTax] = useState(false);
  const [taxRate, setTaxRate] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [brandColor, setBrandColor] = useState('#1b2e5e');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  // const [logoBusy, setLogoBusy] = useState(false);
  // const [logoError, setLogoError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [signatureType, setSignatureType] = useState<SignatureType>('none');
  const [signatureText, setSignatureText] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  // const [sigBusy, setSigBusy] = useState(false);
  // const [sigError, setSigError] = useState<string | null>(null);

  const {
    logoBusy, sigBusy, logoError, sigError,
    handleLogoFile, handleRemoveLogo, handleSignatureDrawn, handleRemoveSignature,
  } = useBrandAssets({
    logoUrl,
    signatureUrl,
    deleteMode: 'immediate',
    onLogoChange: (url) => { setLogoUrl(url); setDraft({ logoUrl: url }); },
    onSignatureChange: setSignatureUrl,
    onSignatureRemoved: () => { setSignatureUrl(''); setSignatureType('none'); },
  });

  // Load the owner's business so this step reflects whatever step 1 (or an earlier visit) saved.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const biz = await businessService.getMyBusiness();
        if (cancelled) return;
        const cur = resolveCurrency(biz.currency);
        const color = biz.brandColorOne || '#1b2e5e';
        setBusiness(biz);
        setCurrency(cur);
        setChargeTax(biz.taxEnabled ?? false);
        setTaxRate(Number(biz.taxRate) > 0 ? biz.taxRate : '');
        setRegNumber(biz.registrationNumber ?? '');
        setBrandColor(color);
        setLogoUrl(biz.logoUrl ?? '');
        setSignatureType(biz.signatureType ?? 'none');
        setSignatureText(biz.signatureText ?? '');
        setSignatureUrl(biz.signatureUrl ?? '');
        setDraft({ name: biz.name, logoUrl: biz.logoUrl ?? '', brandColor: color, currencySymbol: cur.symbol });
      } catch {
        // The form is still usable; saving on Next surfaces the problem.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setDraft]);

  function applyColor(hex: string) {
    setBrandColor(hex);
    setDraft({ brandColor: hex });
  }

  // ── Logo ────────────────────────────────────────────────────────────────
  // async function handleLogoFile(file?: File) {
  //   if (!file) return;
  //   if (!file.type.startsWith('image/')) return setLogoError('Choose a PNG or JPG image.');
  //   if (file.size > MAX_LOGO_BYTES) return setLogoError('That image is over 5MB. Choose a smaller one.');

  //   const previous = logoUrl;
  //   const local = URL.createObjectURL(file);
  //   setLogoError(null);
  //   setLogoUrl(local); // show it right away, same as mobile
  //   setDraft({ logoUrl: local });
  //   setLogoBusy(true);
  //   try {
  //     const url = await uploadImage(file, 'business-logos', 'logo.jpg');
  //     setLogoUrl(url);
  //     setDraft({ logoUrl: url });
  //   } catch {
  //     setLogoUrl(previous);
  //     setDraft({ logoUrl: previous });
  //     setLogoError('Failed to upload logo. Please try again.');
  //   } finally {
  //     URL.revokeObjectURL(local);
  //     setLogoBusy(false);
  //   }
  // }

  // async function handleRemoveLogo() {
  //   setLogoBusy(true);
  //   setLogoError(null);
  //   try {
  //     await deleteCloudinaryAsset('business-logos');
  //     setLogoUrl('');
  //     setDraft({ logoUrl: '' });
  //   } catch {
  //     setLogoError('Failed to remove logo. Please try again.');
  //   } finally {
  //     setLogoBusy(false);
  //   }
  // }

  // // ── Signature ───────────────────────────────────────────────────────────
  // async function handleSignatureDrawn(blob: Blob) {
  //   const previous = signatureUrl;
  //   const local = URL.createObjectURL(blob);
  //   setSigError(null);
  //   setSignatureUrl(local); // immediate preview of the just-drawn signature
  //   setSigBusy(true);
  //   try {
  //     setSignatureUrl(await uploadImage(blob, 'business-signatures', 'signature.png'));
  //   } catch {
  //     setSignatureUrl(previous);
  //     setSigError('Failed to upload signature. Please try drawing it again.');
  //   } finally {
  //     URL.revokeObjectURL(local);
  //     setSigBusy(false);
  //   }
  // }

  // async function handleRemoveSignature() {
  //   // Only flip to "None" once the delete actually succeeds.
  //   setSigBusy(true);
  //   setSigError(null);
  //   try {
  //     await deleteCloudinaryAsset('business-signatures');
  //     setSignatureUrl('');
  //     setSignatureType('none');
  //   } catch {
  //     setSigError('Failed to remove signature. Please try again.');
  //   } finally {
  //     setSigBusy(false);
  //   }
  // }

  // ── Save ────────────────────────────────────────────────────────────────
  async function handleNext() {
    if (!business) {
      // Same as mobile: don't pretend it saved, but don't trap the owner here either.
      setGeneralError('Your business details could not be loaded. You can update them later from Settings.');
      router.push(`${ROUTES.onboarding}/step-3`);
      return;
    }
    const sigProblem = validateSignature(signatureType, signatureText, signatureUrl);
    if (sigProblem) return setGeneralError(sigProblem);
    setSaving(true);
    setGeneralError(null);
    try {
      await businessService.updateBusiness(business.id, {
        currency: currency.code,
        taxEnabled: chargeTax,
        taxRate: chargeTax ? taxRate : '0',
        registrationNumber: regNumber,
        brandColorOne: brandColor,
        logoUrl,
        signatureType,
        signatureText: signatureType === 'text' ? signatureText : '',
        signatureUrl: signatureType === 'image' ? signatureUrl : null,
      });
      router.push(`${ROUTES.onboarding}/step-3`);
    } catch (err) {
      setGeneralError(getErrorMessage(err, 'Something went wrong saving your details. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-primary-container" role="status" aria-label="Loading">
        <Spinner size={28} />
      </div>
    );
  }

  const isCustomColor = HEX_PATTERN.test(brandColor) && !BRAND_COLORS.some(c => normalizeHex(c.hex) === normalizeHex(brandColor));

  return (
    <div>
      <PageHeader title="Business Details" subtitle="Configure your billing and identity settings for professional invoicing." />

      <div className="mt-8 space-y-5">
        {generalError && <ErrorBanner>{generalError}</ErrorBanner>}

        {/* Business Logo */}
        <SectionCard title="Business Logo" subtitle="PNG, JPG up to 5MB">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={e => {
              handleLogoFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {logoUrl ? (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-outline-variant bg-surface p-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Your logo" className="h-20 w-20 rounded-xl border border-outline-variant bg-white object-contain" />
                {logoBusy && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 text-primary-container">
                    <Spinner />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnOutline} disabled={logoBusy} onClick={() => fileRef.current?.click()}>
                  Change Logo
                </button>
                <button type="button" className={`${btnOutline} !border-transparent !text-on-surface-variant`} disabled={logoBusy} onClick={handleRemoveLogo}>
                  <Icon name="delete" size={18} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={logoBusy}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleLogoFile(e.dataTransfer.files?.[0]); }}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-container/15 ${
                dragging ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant bg-surface hover:border-primary-container'
              }`}
            >
              <span className="text-primary-container">{logoBusy ? <Spinner size={32} /> : <Icon name="upload_file" size={32} />}</span>
              <span className="text-sm font-bold uppercase tracking-wider text-primary-container">Upload Logo</span>
              <span className="text-xs text-on-surface-variant">Drop an image here, or click to browse</span>
            </button>
          )}
          {logoError && <p className="mt-3 text-xs text-error">{logoError}</p>}
        </SectionCard>

        {/* Currency + Tax */}
        <SectionCard title="Default Currency">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`${inputCls} flex items-center justify-between text-left`}
          >
            <span>{currency.symbol} - {currency.name}</span>
            <Icon name="keyboard_arrow_down" size={22} className="text-on-surface-variant" />
          </button>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-outline-variant pt-5">
            <div>
              <p className="text-[15px] font-semibold">Charge Tax</p>
              <p className="text-xs text-on-surface-variant">Apply VAT/GST to invoices</p>
            </div>
            <Toggle checked={chargeTax} onChange={setChargeTax} label="Charge Tax" />
          </div>

          {chargeTax && (
            <div className="mt-5">
              <Field label="Tax Rate (%)">
                <div className="flex h-12 overflow-hidden rounded-lg border border-outline-variant bg-white focus-within:border-primary-container">
                  <input
                    className="min-w-0 flex-1 bg-transparent px-4 text-body-md outline-none placeholder:text-outline"
                    inputMode="decimal"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                  />
                  <span className="flex w-12 items-center justify-center border-l border-outline-variant bg-surface-container-low font-semibold text-on-surface-variant">%</span>
                </div>
              </Field>
            </div>
          )}
        </SectionCard>

        {/* Registration + Brand colour */}
        <SectionCard title="Registration and Brand">
          <Field label="Registration No." optional>
            <input className={`${inputCls} uppercase placeholder:normal-case`} value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="e.g. BN-12345678" />
          </Field>

          <div className="mt-5 border-t border-outline-variant pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Brand Color</p>
            <div className="flex flex-wrap items-center gap-2.5">
              {BRAND_COLORS.map(c => {
                const active = normalizeHex(brandColor) === normalizeHex(c.hex);
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={active}
                    onClick={() => applyColor(c.hex)}
                    className="h-10 w-10 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-container/25"
                    style={{ background: c.hex, boxShadow: active ? `0 0 0 3px #fff, 0 0 0 5px ${c.hex}` : 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
                  />
                );
              })}
              {isCustomColor && (
                <span
                  aria-label="Custom colour"
                  className="h-10 w-10 rounded-full"
                  style={{ background: brandColor, boxShadow: `0 0 0 3px #fff, 0 0 0 5px ${brandColor}` }}
                />
              )}
              <button
                type="button"
                aria-label="Add custom colour"
                onClick={() => setColorPickerOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high"
              >
                <Icon name="add" size={20} />
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Signature */}
        <SectionCard title="Signature (Optional)" subtitle="Appears on your invoices as proof of authorization.">
            <SignatureField
                type={signatureType}
                text={signatureText}
                url={signatureUrl}
                uploading={sigBusy}
                onTypeChange={setSignatureType}
                onTextChange={setSignatureText}
                onDrawn={handleSignatureDrawn}
                onRemoveImage={handleRemoveSignature}
            />
            {sigError && <p className="mt-3 text-xs text-error">{sigError}</p>}
            </SectionCard>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => router.back()} className={`${btnOutline} !h-12`}>
          <Icon name="arrow_back" size={18} /> Back
        </button>
        <button type="button" onClick={handleNext} disabled={saving || logoBusy || sigBusy} className={`${btnNavy} !h-12 min-w-[160px]`}>
          {saving ? <Spinner /> : (<>Next <Icon name="arrow_forward" size={18} /></>)}
        </button>
      </div>

      {/* Currency picker */}
      <Modal open={pickerOpen} title="Select Currency" onClose={() => setPickerOpen(false)}>
        <ul className="-mx-2">
          {GLOBAL_CURRENCIES.map(c => {
            const active = currency.code === c.code;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency(c);
                    setDraft({ currencySymbol: c.symbol });
                    setPickerOpen(false);
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-3 text-left text-body-md hover:bg-surface-container-low"
                >
                  <span className={`flex-1 ${active ? 'font-bold' : ''}`}>{c.symbol} - {c.name}</span>
                  {active && <Icon name="check" size={20} className="text-primary-container" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>

      {/* Custom colour */}
      <Modal
        open={colorPickerOpen}
        title="Custom Color"
        onClose={() => setColorPickerOpen(false)}
        footer={
          <button type="button" onClick={() => setColorPickerOpen(false)} className={`${btnNavy} !h-12 w-full`}>
            Done
          </button>
        }
      >
        <CustomColorInput value={brandColor} onChange={applyColor} />
      </Modal>
    </div>
  );
}