// lib/legal.ts
//
// One place for every value that appears in both legal pages. Fill in the
// bracketed placeholders before you publish, and update the dates whenever
// you change either document in a way users should know about.

export const COMPANY = {
  brand: "BillBuzz",
  // The registered company or business name that actually enters into the contract.
  legalName: "Billbuzz Nigeria ltd",
  address: "Lagos, Nigeria",
  contactEmail: "support@billbuzz.ng",
  website: "https://billbuzz.ng",
  billingSite: "https://billbuzz.ng/billing",

  governingLaw: "the Federal Republic of Nigeria",
  courtsCity: "Lagos",

  // Hard-code these. Never use new Date() for a "last updated" line: it
  // changes on every render and stops meaning anything.
  privacyUpdated: "25 October 2026",
  termsUpdated: "25 October 2026",

  // Must match the backend (billing.TRIAL_DAYS and your deletion job).
  trialDays: 15,
  deletionGraceDays: 30,
} as const;

export type Block = { h: string } | { p: string } | { ul: string[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: Block[];
}