'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/layout/Icon';
import { InvoicePreview, type TemplateId } from '@/components/onboarding/InvoicePreview';
import { Spinner } from '@/components/onboarding/bits';
import { useOnboardingDraft } from '@/components/onboarding/OnboardingProvider';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { btnNavy, btnOutline } from '@/components/ui/buttonStyles';
import { useBusiness } from '@/context/BusinessContext';
import { ROUTES } from '@/lib/routes';
import { businessService, type BusinessProfile } from '@/services/business';
import { resolveCurrency } from '@/utils/currencySymbol';
import { getErrorMessage } from '@/utils/getErrorMessage';

const TEMPLATES: { id: TemplateId; name: string; badge?: string; badgeClasses?: string }[] = [
  { id: 'modern', name: 'Modern Corporate', badge: 'Recommended', badgeClasses: 'bg-secondary-container text-on-secondary-container' },
  { id: 'classic', name: 'Classic Clean', badge: 'Popular', badgeClasses: 'bg-[#d4edda] text-[#1a5c2a]' },
  { id: 'minimal', name: 'Minimal Edge' },
  { id: 'professional', name: 'Professional', badge: 'New', badgeClasses: 'bg-[#d4edda] text-[#1a5c2a]' },
];

function getMissingFields(biz: BusinessProfile): string[] {
  const missing: string[] = [];
  if (!biz.name?.trim()) missing.push('Business name');
  if (!biz.currency?.trim()) missing.push('Default currency');
  if (biz.taxEnabled && (!biz.taxRate || Number(biz.taxRate) <= 0)) missing.push('Tax rate');
  if (!biz.brandColorOne?.trim()) missing.push('Brand color');
  if (!biz.selectedTemplateId) missing.push('Invoice template');
  return missing;
}

export default function OnboardingStep3() {
  const router = useRouter();
  const { refreshBusiness } = useBusiness();
  const { draft, setDraft } = useOnboardingDraft();

  const [selected, setSelected] = useState<TemplateId>('modern');
  const [finishing, setFinishing] = useState(false);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  // The draft is empty if someone lands here directly, so load the real brand details for the previews.
  useEffect(() => {
    let cancelled = false;
    businessService
      .getMyBusiness()
      .then(biz => {
        if (cancelled) return;
        setDraft({
          name: biz.name,
          logoUrl: biz.logoUrl ?? '',
          brandColor: biz.brandColorOne || '#1b2e5e',
          currencySymbol: resolveCurrency(biz.currency).symbol,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setDraft]);

  async function handleFinish() {
    setFinishing(true);
    let pending: { title: string; body: string } | null = null;
    try {
      const biz = await businessService.getMyBusiness();
      const updated = await businessService.updateBusiness(biz.id, { selectedTemplateId: selected });

      const missing = getMissingFields(updated);
      if (missing.length === 0) {
        await businessService.completeOnboarding(updated.id);
      } else {
        pending = {
          title: 'A few details are still missing',
          body: `You can finish these later from Settings: ${missing.join(', ')}.`,
        };
      }
      await refreshBusiness();
    } catch (err) {
      pending = {
        title: 'Setup incomplete',
        body: getErrorMessage(err, 'We could not confirm your business details were saved. You can finish setup later from Business Settings.'),
      };
    } finally {
      setFinishing(false);
    }
    // Mobile always lands on the dashboard afterwards; the message just has to be read first.
    if (pending) setNotice(pending);
    else router.replace(ROUTES.ownerHome);
  }

  return (
    <div>
      <PageHeader
        title="Choose your template"
        subtitle="Select the visual identity for your business invoices. You can change this later."
      />

      <div role="radiogroup" aria-label="Invoice template" className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map(t => {
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setSelected(t.id);
                setDraft({ template: t.id });
              }}
              className={`relative rounded-2xl bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-container/20 ${
                active
                  ? 'border-2 border-primary-container shadow-[0_14px_30px_-14px_rgba(27,46,94,0.45)]'
                  : 'border border-outline-variant hover:border-outline'
              }`}
            >
              <div className="rounded-xl bg-surface-container-low p-4">
                <InvoicePreview
                  template={t.id}
                  accent={draft.brandColor}
                  name={draft.name}
                  logoUrl={draft.logoUrl}
                  currencySymbol={draft.currencySymbol}
                />
              </div>

              {active && (
                <span className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-white shadow">
                  <Icon name="check" size={18} />
                </span>
              )}

              <div className="mt-4 space-y-1.5 px-1">
                {t.badge && (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${t.badgeClasses}`}>
                    {t.badge}
                  </span>
                )}
                <p className="text-xl font-extrabold">{t.name}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => router.back()} className={`${btnOutline} !h-12`}>
          <Icon name="arrow_back" size={18} /> Back
        </button>
        <div className="flex flex-col items-end gap-1.5">
          <button type="button" onClick={handleFinish} disabled={finishing} className={`${btnNavy} !h-12 min-w-[180px]`}>
            {finishing ? <Spinner /> : (<>Finish Setup <Icon name="chevron_right" size={22} /></>)}
          </button>
          <span className="text-xs text-on-surface-variant">Step 3 of 3 • Almost there</span>
        </div>
      </div>

      <Modal
        open={!!notice}
        title={notice?.title ?? ''}
        onClose={() => router.replace(ROUTES.ownerHome)}
        footer={
          <button type="button" onClick={() => router.replace(ROUTES.ownerHome)} className={`${btnNavy} !h-12 w-full`}>
            Continue to dashboard
          </button>
        }
      >
        <p className="text-body-md text-on-surface-variant">{notice?.body}</p>
      </Modal>
    </div>
  );
}