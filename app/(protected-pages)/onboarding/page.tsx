import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

export default function OnboardingIndex() {
  redirect(`${ROUTES.onboarding}/step-1`);
}