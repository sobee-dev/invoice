'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Icon } from '@/components/layout/Icon';
import { Field, inputCls, textareaCls, Spinner } from '@/components/onboarding/bits';
import { useOnboardingDraft } from '@/components/onboarding/OnboardingProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Toast, type ToastState } from '@/components/ui/Toast';
import { btnNavy } from '@/components/ui/buttonStyles';
import { ROUTES } from '@/lib/routes';
import { businessService } from '@/services/business';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function OnboardingStep1() {
  const router = useRouter();
  const { setDraft } = useOnboardingDraft();

  const [bizName, setBizName] = useState('');
  const [description, setDescription] = useState('');
  const [motto, setMotto] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressOne, setAddressOne] = useState('');
  const [addressTwo, setAddressTwo] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!bizName.trim()) {
      setNameError('Please enter your business name to continue.');
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      await businessService.createBusiness({
        name: bizName.trim(),
        description: description.trim(),
        motto: motto.trim(),
        email: email.trim(),
        phone: phone.trim(),
        addressOne: addressOne.trim(),
        addressTwo: addressTwo.trim(),
      });
      router.push(`${ROUTES.onboarding}/step-2`);
    } catch (err) {
      // createBusiness can fail for real reasons (validation, network) or because
      // this owner already has a business (re-opening onboarding). Verify a
      // business actually exists before treating it as safe to continue.
      try {
        await businessService.getMyBusiness();
        router.push(`${ROUTES.onboarding}/step-2`);
      } catch {
        setToast({
          tone: 'error',
          text: getErrorMessage(err, 'Something went wrong creating your business profile. Please check your connection and try again.'),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleNext} noValidate>
      <PageHeader title="Business Profile" subtitle="Tell us a bit about your business to get your first invoice ready." />

      <SectionCard className="mt-8">
        <div className="space-y-5">
          <Field label="Business Name" error={nameError ?? undefined}>
            <input
              className={inputCls}
              value={bizName}
              onChange={e => {
                setBizName(e.target.value);
                setDraft({ name: e.target.value });
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Acme Corp"
              autoComplete="organization"
              autoFocus
            />
          </Field>

          <Field label="Business Description" optional>
            <textarea className={textareaCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Importers & exporters of..." />
          </Field>

          <Field label="Business Motto / Tagline" optional>
            <input className={inputCls} value={motto} onChange={e => setMotto(e.target.value)} placeholder="e.g. In God We Trust" />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business Email">
              <input className={inputCls} type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="billing@acme.com" />
            </Field>
            <Field label="Phone">
              <input className={inputCls} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </Field>
          </div>

          <Field label="Address Line 1">
            <input className={inputCls} autoComplete="address-line1" value={addressOne} onChange={e => setAddressOne(e.target.value)} placeholder="123 Business Way, Suite 100" />
          </Field>
          <Field label="Address Line 2" optional>
            <input className={inputCls} autoComplete="address-line2" value={addressTwo} onChange={e => setAddressTwo(e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Icon name="lock" size={14} /> Your data is securely stored and encrypted.
        </p>
        <button type="submit" disabled={saving} className={`${btnNavy} !h-12 sm:min-w-[160px]`}>
          {saving ? <Spinner /> : (<>Next <Icon name="arrow_forward" size={20} /></>)}
        </button>
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </form>
  );
}