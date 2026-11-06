// app/privacy-policy/page.tsx
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { COMPANY as C, type LegalSection } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy | ${C.brand}`,
  description: `How ${C.brand} collects, uses, shares and protects personal data.`,
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "1. Who we are and what this policy covers",
    blocks: [
      {
        p: `${C.brand} is an invoicing, inventory and business-management service operated by ${C.legalName} ("${C.brand}", "we", "us"), of ${C.address}. It includes our mobile apps for iOS and Android, our websites (${C.website} and ${C.billingSite}), and our application programming interfaces (together, the "Service").`,
      },
      { p: "This policy explains what personal data we handle, why, who we share it with, how long we keep it and what choices you have. We process personal data in line with the Nigeria Data Protection Act 2023 (NDPA) and, where they apply to you, other laws such as the EU and UK GDPR and the California Consumer Privacy Act." },
      { h: "Two different roles" },
      {
        ul: [
          `Controller. For information about you as a ${C.brand} user (your account, sign-in, subscription, device and usage data), we decide why and how the data is used. We are the data controller.`,
          `Processor. For information that a business enters about its own customers, suppliers and staff (invoice recipients, customer contact details, product lists and so on), the business decides what goes in and why. That business is the controller and we act as its data processor, handling the data only to provide the Service and on its instructions.`,
        ],
      },
      {
        p: `If you are a customer or supplier of a business that uses ${C.brand}, this policy does not govern that business's use of your data. Please contact the business directly about how it handles your information. We will help the business respond to your request where we can.`,
      },
    ],
  },
  {
    id: "information-we-collect",
    title: "2. Information we collect",
    blocks: [
      { h: "Information you give us" },
      {
        ul: [
          "Account details: email address, name and a passcode. We store the passcode only as a salted, one-way hash. If you sign in with Google we receive your name and verified email address from Google and never see your Google password.",
          "Business profile: business name, description, motto, address, phone, email, registration number, logo, brand colours, default currency, tax settings, invoice template choice, and any text or drawn signature you add.",
          "Customer and supplier records: names, email addresses, phone numbers, payment preferences, tags and notes that you enter, plus balances and lifetime value we calculate from your documents.",
          "Products and inventory: product names, SKUs, descriptions, prices, product images, stock quantities, reorder levels, and the history of stock adjustments with the reasons you give.",
          "Documents: sales invoices, proforma invoices and supplier orders, including line items, amounts, tax, discounts, notes, dates, status and payment or delivery marks.",
          "Staff accounts: the name, email address, department and permission level the owner enters for each staff member, and the sign-in and activity data described below.",
          "Support messages: anything you send us when you contact us, and our replies.",
        ],
      },
      { h: "Information collected automatically" },
      {
        ul: [
          "Device and app data: device type, operating system and version, app version, language and time zone.",
          "Usage data: screens viewed, features used and actions taken in the app. We link this to your account so that we can understand how the product is used and fix problems. It is not anonymous.",
          "Diagnostics: crash reports and error details, which may include technical identifiers and the screen you were on.",
          "Log data: IP address, request time, and security events such as failed sign-in attempts and rate-limit hits.",
          "Push notification tokens: if you allow notifications, an identifier issued by the Expo push service for your device so we can send alerts such as low stock warnings.",
        ],
      },
      { h: "Information from other sources" },
      {
        ul: [
          "Google, when you choose Sign in with Google.",
          "Stripe, our payment provider, which tells us your subscription status, plan, billing period and whether a payment succeeded or failed. We do not receive or store your full card number.",
          "Your business owner, if you are a staff member: they create your account and set your department and permission level.",
        ],
      },
      {
        p: "We do not knowingly collect sensitive categories of personal data such as health, biometric, religious or political information, and we ask you not to enter them into free-text fields like notes.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "3. How we use information and our legal bases",
    blocks: [
      {
        ul: [
          "To provide the Service: create and secure accounts, generate and store documents, track inventory, apply role-based access, produce reports and send the notifications you enable. Basis: performance of our contract with you.",
          "To manage subscriptions: run the free trial, take payments through Stripe, send receipts and handle cancellations. Basis: contract and legal obligation.",
          "To keep the Service safe: detect fraud and abuse, enforce rate limits, investigate incidents, and keep audit records of account status changes. Basis: legitimate interests and legal obligation.",
          "To improve and develop the product: analyse usage, find and fix bugs, and test new features. Basis: legitimate interests, which we balance against your rights.",
          "To communicate with you: service emails (verification, password changes, billing, security and policy updates) and replies to support requests. Basis: contract and legitimate interests. We send marketing only where you have agreed and you can withdraw at any time.",
          "To meet legal duties: respond to lawful requests, keep financial records, and defend legal claims. Basis: legal obligation and legitimate interests.",
        ],
      },
      { p: "Where we rely on consent, such as push notifications or optional marketing, you can withdraw it at any time in the app settings or by contacting us. Withdrawing does not affect processing that already took place." },
      { p: "We do not make decisions that have legal or similarly significant effects on you based solely on automated processing, and we do not use your business data to train artificial intelligence models." },
    ],
  },
  {
    id: "customer-data",
    title: "4. Data we process on behalf of businesses",
    blocks: [
      {
        p: "When you use the Service to invoice your customers or order from suppliers, you are the controller of the personal data in those records and you are responsible for having a lawful basis to collect it and for giving your own customers any notices the law requires.",
      },
      {
        ul: [
          "We process that data only to provide the Service, following your documented instructions in the app and these terms.",
          "We keep it confidential and limit access to staff and service providers who need it.",
          "We use sub-processors listed in section 6 and bind them to equivalent data protection obligations.",
          "We tell you without undue delay if we become aware of a personal data breach affecting it.",
          "We help you answer access, correction and deletion requests from your customers, and delete or return the data when your account ends, subject to section 9.",
        ],
      },
      { p: `If you need a signed data processing agreement, contact ${C.contactEmail}.` },
    ],
  },
  {
    id: "analytics",
    title: "5. Analytics, error monitoring and cookies",
    blocks: [
      {
        p: "We use a product analytics and error monitoring service (PostHog) inside the apps and websites. Events are tied to your account identifier and may include your email, name and role so we can investigate issues for a specific user. We do not use this data for advertising, and we do not sell it or share it with advertisers.",
      },
      { h: "Cookies and similar storage" },
      {
        ul: [
          "Mobile apps keep sign-in tokens in your device's secure storage (Keychain on iOS, Keystore-backed storage on Android) and remove them when you sign out or your session expires. Sessions end automatically after a maximum of 14 days.",
          "Our websites use browser storage or strictly necessary cookies to keep you signed in, remember preferences and protect against fraud. These are required for the Service to work.",
          "Analytics identifiers are used as described above. We do not use third-party advertising cookies or cross-site tracking.",
        ],
      },
      { p: "You can clear browser storage at any time, which will sign you out. Where the law requires consent for non-essential analytics we will ask for it, and you can opt out through the settings or by contacting us." },
    ],
  },
  {
    id: "sharing",
    title: "6. Who we share information with",
    blocks: [
      { p: "We do not sell your personal data, and we do not share it for cross-context behavioural advertising. We share it only in these ways:" },
      {
        ul: [
          "Service providers (sub-processors) acting for us: cloud hosting and database providers; Cloudinary for storing logos, signatures and product images; Stripe for payments; PostHog for analytics and diagnostics; Expo for delivering push notifications; Google for Sign in with Google; and an email delivery provider for transactional email.",
          "Your business: if you are staff, the business owner can see the documents you create, your name, email, department, permission level and activity within the business.",
          "People you choose: when you send or share an invoice, the recipient sees what is on it, including your business name, logo, contact details and signature.",
          "Professional advisers, auditors and insurers, under confidentiality duties.",
          "Authorities and courts, where we believe disclosure is required by law, legal process or to protect rights, safety or the security of the Service. Where permitted, we will tell you first.",
          "A buyer or successor, if we are involved in a merger, acquisition, financing or sale of assets. We will notify you and the new owner must honour this policy or give you a choice.",
        ],
      },
      { p: "A current list of sub-processors is available on request." },
    ],
  },
  {
    id: "transfers",
    title: "7. International transfers",
    blocks: [
      {
        p: "Our providers operate in several countries, including outside Nigeria, so your information may be processed in places that have different data protection laws. Where we transfer personal data out of Nigeria, the UK or the European Economic Area, we do so only where the NDPA and other applicable law allow it, for example because the destination has adequate protection or we have put contractual safeguards such as standard contractual clauses and security measures in place.",
      },
    ],
  },
  {
    id: "security",
    title: "8. How we protect information",
    blocks: [
      {
        ul: [
          "Encryption in transit using TLS for traffic between the apps, websites and our servers.",
          "Passcodes stored only as salted hashes, never in readable form.",
          "Short-lived access tokens, refresh token rotation and blacklisting on sign-out, and an absolute session limit.",
          "Role-based access control enforced on the server, so staff see only what their permission level allows.",
          "Rate limiting and throttling against automated attacks, and signed, scoped uploads for images.",
          "Access limited to personnel who need it, and monitoring of our infrastructure.",
        ],
      },
      { p: "No system is perfectly secure. Choose a passcode you do not use elsewhere, keep your device locked, and tell us at once if you think your account has been accessed without permission." },
      {
        p: "If a personal data breach is likely to put people's rights at risk, we will notify the Nigeria Data Protection Commission within 72 hours of becoming aware, as the NDPA requires, and tell affected users and business owners without undue delay where the law or the risk calls for it.",
      },
    ],
  },
  {
    id: "retention",
    title: "9. How long we keep information",
    blocks: [
      {
        ul: [
          "Account and business data: for as long as your account is open.",
          `Deleted accounts: when you request deletion, the account is deactivated and scheduled for permanent deletion after a grace period of ${C.deletionGraceDays} days. You can reactivate it by signing in during that time. After the grace period we delete or irreversibly anonymise the account and business data, except as below.`,
          "Documents you delete in the app are first marked as deleted so they can be audited or recovered, and are removed with the rest of the account data when it is purged.",
          "Backups: copies in encrypted backups are overwritten on a rolling schedule, normally within 90 days of deletion.",
          "Billing and tax records: kept for as long as the law requires, typically at least six years.",
          "Security and audit logs, including account status history: kept for up to 24 months, or longer if needed to resolve a dispute or comply with law.",
          "Support correspondence: kept for up to 3 years after the matter closes.",
        ],
      },
    ],
  },
  {
    id: "rights",
    title: "10. Your rights",
    blocks: [
      { p: "Depending on where you live, you have some or all of these rights over personal data we hold as a controller:" },
      {
        ul: [
          "Be informed about how your data is used, which this policy aims to do.",
          "Access a copy of your data and details of how it is processed.",
          "Correct data that is wrong or incomplete. Most profile and business details can be edited directly in the app.",
          "Delete your data, subject to legal retention duties.",
          "Restrict or object to processing, including processing based on our legitimate interests and any direct marketing.",
          "Receive your data in a structured, commonly used, machine-readable format and have it transferred to another provider (portability).",
          "Withdraw consent at any time where processing relies on it.",
          "Not be subject to decisions based solely on automated processing that significantly affect you.",
          "Lodge a complaint with a regulator.",
        ],
      },
      {
        p: `To use a right, email ${C.contactEmail} from the address on your account. We may ask you to verify your identity, and we aim to respond within 30 days. We will not charge a fee unless a request is clearly unfounded or excessive. If you ask us about data that a business controls, we will pass the request to that business or help you reach it.`,
      },
      { h: "Complaints" },
      {
        p: "If you are unhappy with how we handle your data, please talk to us first. You also have the right to complain to the Nigeria Data Protection Commission (ndpc.gov.ng) or to the data protection authority where you live or work.",
      },
      { h: "California residents" },
      {
        p: "We do not sell or share personal information as those terms are defined by the California Consumer Privacy Act, and we do not use sensitive personal information to infer characteristics about you. California residents may ask to know, correct or delete their information and will not be treated differently for exercising these rights.",
      },
    ],
  },
  {
    id: "deleting",
    title: "11. Deleting your account and exporting your data",
    blocks: [
      {
        ul: [
          "Delete: use account deletion in the app settings, or write to us. Password-based accounts confirm with their passcode, and Google-only accounts confirm with Google. See section 9 for the grace period.",
          "Export: ask us for an export of your documents, customers and products, or use any export tools offered in the app. We will provide it in a common format such as CSV or PDF.",
          "Business owners should export records they must keep for tax or accounting before deleting the account.",
        ],
      },
    ],
  },
  {
    id: "children",
    title: "12. Children",
    blocks: [
      {
        p: `${C.brand} is a business tool for adults. You must be at least 18 years old to create an account. We do not knowingly collect personal data from anyone under 18. If you think a child has given us personal data, contact us and we will delete it promptly.`,
      },
    ],
  },
  {
    id: "third-party",
    title: "13. Third-party links and services",
    blocks: [
      { p: "The Service links to and works with services we do not control, such as Stripe, Google and your own email app. Their privacy practices are their own, so please read their policies before you use them." },
    ],
  },
  {
    id: "changes",
    title: "14. Changes to this policy",
    blocks: [
      {
        p: "We may update this policy as our Service or the law changes. We will change the date at the top and, for material changes, notify you by email or in the app before the change takes effect. Continuing to use the Service afterwards means you accept the updated policy, except where the law requires your consent.",
      },
    ],
  },
  {
    id: "contact",
    title: "15. Contact us",
    blocks: [
      {
        p: `${C.legalName}, ${C.address}. Email: ${C.contactEmail}. We aim to answer privacy questions within 48 hours and to resolve requests within 30 days.`,
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      updated={C.privacyUpdated}
      intro={`This policy explains what data ${C.brand} collects, why we collect it, who sees it and what control you have.`}
      highlights={[
        "We collect what we need to run invoicing, inventory and your account.",
        "We never sell your data or use it for advertising.",
        "Your customers' details stay yours. We only process them to provide the service.",
        "We use analytics and error monitoring that are linked to your account.",
        "You can ask us to export or delete your data at any time.",
      ]}
      sections={sections}
      otherDoc={{ href: "/terms", label: "Terms of Use" }}
    />
  );
}