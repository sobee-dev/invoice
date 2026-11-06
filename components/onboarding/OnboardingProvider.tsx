'use client';
// Draft shared across the three steps so the live invoice preview can react as
// the owner types. The server stays the source of truth: each step saves to the
// API before moving on, exactly like mobile.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { DEFAULT_CURRENCY } from '@/data/constants';
import type { TemplateId } from './InvoicePreview';

export interface OnboardingDraft {
  name: string;
  logoUrl: string;
  brandColor: string;
  template: TemplateId;
  currencySymbol: string;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  name: '',
  logoUrl: '',
  brandColor: '#1b2e5e',
  template: 'modern',
  currencySymbol: DEFAULT_CURRENCY.symbol,
};

interface Ctx {
  draft: OnboardingDraft;
  setDraft: (patch: Partial<OnboardingDraft>) => void;
}

const OnboardingContext = createContext<Ctx>({ draft: DEFAULT_DRAFT, setDraft: () => {} });

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<OnboardingDraft>(DEFAULT_DRAFT);
  const setDraft = useCallback(
    (patch: Partial<OnboardingDraft>) => setDraftState(prev => ({ ...prev, ...patch })),
    [],
  );
  return <OnboardingContext.Provider value={{ draft, setDraft }}>{children}</OnboardingContext.Provider>;
}

export const useOnboardingDraft = () => useContext(OnboardingContext);