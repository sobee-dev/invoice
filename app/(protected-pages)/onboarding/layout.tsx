'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { InvoicePreview } from '@/components/onboarding/InvoicePreview';
import { OnboardingProvider, useOnboardingDraft } from '@/components/onboarding/OnboardingProvider';
import { Icon } from '@/components/layout/Icon';
import { btnNavy } from '@/components/ui/buttonStyles';
import Loader from '@/components/Loader';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { ROUTES, homeForRole } from '@/lib/routes';

const BASE = ROUTES.onboarding;
const STEPS = [
  { href: `${BASE}/step-1`, title: 'Business Profile', sub: 'Who is on the invoice' },
  { href: `${BASE}/step-2`, title: 'Business Details', sub: 'Billing and identity' },
  { href: `${BASE}/step-3`, title: 'Template', sub: 'How invoices look' },
];

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { business, isLoading: businessLoading, loadFailed, refreshBusiness } = useBusiness();
  const { draft } = useOnboardingDraft();

  // Only block on the very first load. Later refreshes (step 3 calls
  // refreshBusiness) must not unmount the page and lose its state.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!authLoading && !(user && businessLoading)) setReady(true);
  }, [authLoading, user, businessLoading]);

  // Onboarding is an owner-only flow, and finished businesses skip it.
  useEffect(() => {
    if (!ready || businessLoading) return;
    if (!user) router.replace(ROUTES.login);
    else if (user.requiresPasswordChange) router.replace(ROUTES.forcePasswordChange);
    else if (user.role !== 'owner' || business?.onboardingComplete) router.replace(homeForRole(user.role));
  }, [ready, businessLoading, user, business, router]);

  const current = Math.max(0, STEPS.findIndex(s => pathname.startsWith(s.href)));
  const showPreview = current < 2; // step 3 shows each template instead

  // Same per-step Skip behaviour as mobile.
  async function handleSkip() {
    if (current === 0) return router.replace(ROUTES.ownerHome);
    if (current === 1) return router.replace(STEPS[2].href);
    await refreshBusiness();
    router.replace(ROUTES.ownerHome);
  }

  if (!ready) return <Loader />;

  if (user && loadFailed && !business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-md text-on-surface-variant">
          We could not load your business. Please check your connection and try again.
        </p>
        <button type="button" onClick={() => refreshBusiness()} className={`${btnNavy} !h-12 px-6`}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <span className="text-2xl font-extrabold text-primary-container">BillBuzz</span>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-surface-container px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            Step {current + 1} of 3
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
          >
            Skip
          </button>
        </div>
      </header>

      <nav aria-label="Onboarding progress" className="mx-auto max-w-6xl px-5">
        <ol className="grid grid-cols-3 gap-3">
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.href} aria-current={active ? 'step' : undefined}>
                <div className={`mb-2.5 h-1 rounded-full ${done || active ? 'bg-primary-container' : 'bg-outline-variant'} ${done ? 'opacity-50' : ''}`} />
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? 'bg-primary-container text-white'
                        : active
                          ? 'border-2 border-primary-container text-primary-container'
                          : 'border border-outline-variant text-outline'
                    }`}
                  >
                    {done ? <Icon name="check" size={14} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-semibold ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{s.title}</span>
                    <span className="hidden truncate text-xs text-outline sm:block">{s.sub}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <main className={`mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-10 ${showPreview ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
        <div className="min-w-0">{children}</div>

        {showPreview && (
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="mb-3 text-sm font-semibold text-on-surface-variant">Your invoice, as you build it</p>
              <InvoicePreview
                template={draft.template}
                accent={draft.brandColor}
                name={draft.name}
                logoUrl={draft.logoUrl}
                currencySymbol={draft.currencySymbol}
              />
              <p className="mt-3 text-xs text-outline">Sample figures. Your real invoices use this layout.</p>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      <Shell>{children}</Shell>
    </OnboardingProvider>
  );
}