// app/terms/page.tsx
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { COMPANY as C, type LegalSection } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Use | ${C.brand}`,
  description: `The terms that apply when you use ${C.brand} for invoicing and inventory management.`,
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "1. Agreement to these terms",
    blocks: [
      {
        p: `These Terms of Use ("Terms") are a binding agreement between you and ${C.legalName} ("${C.brand}", "we", "us"), of ${C.address}. They apply to the ${C.brand} mobile apps, websites (${C.website} and ${C.billingSite}), APIs and related services (the "Service").`,
      },
      {
        p: `By creating an account, signing in, or using the Service you accept these Terms and our Privacy Policy. If you use the Service for a business, you confirm that you have authority to bind that business, and "you" includes it. If you do not agree, do not use the Service.`,
      },
    ],
  },
  {
    id: "service",
    title: "2. What the Service does",
    blocks: [
      {
        p: "The Service lets businesses create and manage sales invoices, proforma invoices and supplier orders, keep track of products and stock, manage customers and staff, view reports, and receive alerts. It is software for your own record-keeping and communication with your customers.",
      },
      {
        p: `${C.brand} is not a bank, payment processor, accountant, tax adviser or law firm. Documents produced in the Service, including totals, tax calculations and amounts in words, do not constitute accounting, tax or legal advice. You are responsible for checking them before you rely on or send them.`,
      },
    ],
  },
  {
    id: "accounts",
    title: "3. Eligibility and accounts",
    blocks: [
      {
        ul: [
          "You must be at least 18 years old and able to enter a binding contract.",
          "You must give accurate information and keep it up to date.",
          "You can sign in with an email address and passcode, or with Google. Choose a passcode you do not use anywhere else, keep it and your device secure, and do not share it.",
          "You are responsible for everything done through your account, including by people you give access to, until you tell us it has been compromised.",
          "Tell us immediately at the address in section 22 if you suspect unauthorised access.",
          "Sessions expire automatically for your security, so you may be asked to sign in again.",
        ],
      },
    ],
  },
  {
    id: "roles",
    title: "4. Owners and staff",
    blocks: [
      {
        ul: [
          "The person who creates a business account is its owner. Owners control the business profile, billing, staff access and business data.",
          "Owners can create staff accounts or invite staff, set a department and permission level, and deactivate staff. Staff can only do what their permission level allows.",
          "Owners are responsible for their staff's use of the Service, for choosing appropriate permissions, and for removing access when someone leaves.",
          "Documents and records created by staff belong to the business, and the owner can see them.",
          "If you are staff, your access depends on the owner and may be changed or removed by them at any time.",
        ],
      },
    ],
  },
  {
    id: "plans",
    title: "5. Free trial, subscriptions and payment",
    blocks: [
      {
        ul: [
          `New businesses start with a free trial of ${C.trialDays} days. No card is required unless we say so at sign-up.`,
          `After the trial you need a paid plan to keep full access. Plans, prices and features are shown at ${C.billingSite} and may differ by plan tier.`,
          "Payments are processed by Stripe. We do not receive or store your full card details. Your use of Stripe is subject to Stripe's own terms.",
          "Paid plans renew automatically at the end of each billing period until cancelled. You authorise us and Stripe to charge your payment method for each renewal, along with any applicable taxes.",
          "You can cancel at any time from the billing site. Cancellation takes effect at the end of the period you have paid for, and you keep access until then.",
          "If a payment fails, your account may move to a past-due state. We may give a short grace period, and then limit the Service to read-only or locked access until payment is made. Your data is not deleted because of a payment failure alone.",
          "Fees are non-refundable except where the law requires or where we say otherwise in writing.",
          "We may change prices or plans with at least 30 days' notice. The change applies from your next renewal, and you can cancel before then.",
          "You are responsible for any taxes, duties and bank or currency conversion charges on your payments.",
        ],
      },
    ],
  },
  {
    id: "your-content",
    title: "6. Your data and content",
    blocks: [
      {
        p: `You keep all rights in the information, documents, logos, images and other content you put into the Service ("Your Content"), including your customer and product records. We do not claim ownership of it.`,
      },
      {
        p: `You give us a limited, worldwide, non-exclusive licence to host, store, process, transmit and display Your Content, and to generate documents from it, only as needed to run and improve the Service for you, comply with law, and enforce these Terms. We do not sell Your Content.`,
      },
      {
        ul: [
          "You promise that you own Your Content or have the rights and permissions to use it, and that it does not infringe anyone's rights or break the law.",
          "You are the controller of personal data about your own customers, suppliers and staff that you enter. You are responsible for having a lawful basis to collect it, giving the notices the law requires, and answering requests from those people. Our Privacy Policy explains how we act as your processor.",
          "You are responsible for keeping your own copies of records you need for tax, audit or legal purposes. Export them before deleting an account.",
        ],
      },
    ],
  },
  {
    id: "documents",
    title: "7. Invoices, taxes and stock records",
    blocks: [
      {
        ul: [
          "You are solely responsible for the accuracy and legality of the invoices and other documents you issue, including prices, quantities, tax rates, discounts, currency, customer details and your business registration details.",
          "You are responsible for complying with tax, invoicing, consumer protection and record-keeping laws that apply to you, including any e-invoicing or VAT registration requirements.",
          "Stock levels and inventory deductions are calculated from what you and your staff enter. Mistakes, delayed updates or sales made outside the Service may cause records to differ from real stock. Reconcile regularly.",
          "Marking a document paid, delivered or deleted only changes its status in the Service. It does not move money, deliver goods or notify authorities.",
          "Sending a document to a customer is your decision. We are not a party to your transactions or responsible for disputes between you and your customers or suppliers.",
          "Your branding, signature and logo appear on documents as you set them. You confirm you are authorised to use them.",
        ],
      },
    ],
  },
  {
    id: "acceptable-use",
    title: "8. Acceptable use",
    blocks: [
      { p: "You agree not to:" },
      {
        ul: [
          "use the Service for anything unlawful, fraudulent or deceptive, including creating fake or misleading invoices, or helping anyone evade tax or launder money;",
          "upload malware, or try to disrupt, overload, probe or bypass the security or rate limits of the Service;",
          "access accounts, data or features that are not yours, or try to defeat role-based access controls;",
          "reverse engineer, decompile or copy the Service, except where the law allows it despite this restriction;",
          "scrape or extract data automatically, or use the Service to build a competing product;",
          "resell, sublicense or provide the Service to third parties unless we agree in writing;",
          "upload content that is unlawful, defamatory, infringing, hateful, or that contains sensitive personal data you have no right to hold;",
          "use the API in a way that breaches fair-use limits or our documentation; or",
          "impersonate another person or business, or misrepresent your affiliation.",
        ],
      },
      { p: "We apply request throttling to protect the Service. If you exceed limits, requests may be delayed or rejected." },
    ],
  },
  {
    id: "third-parties",
    title: "9. Third-party services",
    blocks: [
      {
        p: `The Service relies on and may link to third-party services such as Stripe, Google, Cloudinary, Expo and app stores. Their terms govern your use of them. We are not responsible for their availability, content or practices. If you download the app from Apple's App Store or Google Play, those stores' terms also apply, and the store provider is not responsible for the Service or for providing support for it.`,
      },
    ],
  },
  {
    id: "communications",
    title: "10. Notifications and communications",
    blocks: [
      {
        p: "We send service messages by email and, if you allow it, push notifications, such as low stock alerts, payment reminders, summaries and security notices. You can change notification preferences in the app and turn off push alerts in your device settings. Some essential messages about your account, security, billing or these Terms cannot be turned off while you have an account.",
      },
    ],
  },
  {
    id: "ip",
    title: "11. Our intellectual property",
    blocks: [
      {
        p: `The Service, including its software, design, templates, text, graphics, trademarks and logos, belongs to ${C.legalName} or its licensors and is protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable, revocable right to use the Service for your business in line with these Terms. No other rights are given.`,
      },
      {
        p: "If you send us feedback or ideas, you let us use them freely without payment or attribution.",
      },
    ],
  },
  {
    id: "privacy",
    title: "12. Privacy",
    blocks: [
      {
        p: "Our Privacy Policy explains how we handle personal data and forms part of these Terms. In case of conflict about personal data, the Privacy Policy and any data processing agreement between us take priority.",
      },
    ],
  },
  {
    id: "availability",
    title: "13. Availability and changes to the Service",
    blocks: [
      {
        ul: [
          "We work to keep the Service available, but we do not promise it will be uninterrupted, error-free or secure at all times. We may carry out maintenance, and outages can happen, including those caused by our providers or by internet and power disruptions.",
          "We may add, change or remove features. If we remove a feature you pay for in a way that materially harms you, we will give reasonable notice.",
          "Beta or preview features are provided as is and may change or end at any time.",
          "Keep your app updated. Older versions may stop working.",
        ],
      },
    ],
  },
  {
    id: "termination",
    title: "14. Suspension, termination and deletion",
    blocks: [
      {
        ul: [
          "You may stop using the Service and delete your account at any time from the app or by contacting us.",
          `When you request deletion your account is deactivated and permanently deleted after a grace period of ${C.deletionGraceDays} days, during which you can reactivate by signing in. See our Privacy Policy for what is retained after that.`,
          "We may suspend or end your access immediately if you breach these Terms, put the Service or other users at risk, fail to pay, or if we must do so by law. Where practical and lawful, we will tell you why and, if the issue can be fixed, give you a chance to fix it.",
          "If the business owner's account is suspended, staff access to that business may also be suspended.",
          "On termination your right to use the Service ends. Sections that by their nature should survive, including those on Your Content, intellectual property, disclaimers, liability, indemnity and governing law, continue to apply.",
        ],
      },
    ],
  },
  {
    id: "disclaimers",
    title: "15. Disclaimers",
    blocks: [
      {
        p: `To the fullest extent the law allows, the Service is provided "as is" and "as available". We do not give any warranty, express or implied, including of merchantability, fitness for a particular purpose, accuracy, non-infringement, or that the Service will meet your requirements or be free from errors, delays or interruptions. Reports, analytics and "advisory" insights are informational only and are not financial, tax or legal advice.`,
      },
      { p: "Some laws do not allow certain disclaimers, so some of the above may not apply to you." },
    ],
  },
  {
    id: "liability",
    title: "16. Limitation of liability",
    blocks: [
      { p: "To the fullest extent the law allows:" },
      {
        ul: [
          "we are not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, goodwill, data or business opportunities, even if we were told they were possible;",
          "we are not liable for losses caused by your invoices, tax filings, stock records or decisions made using the Service, by third-party services, or by events outside our reasonable control; and",
          "our total liability to you for all claims relating to the Service will not exceed the greater of the amount you paid us in the 12 months before the event giving rise to the claim, and NGN 50,000.",
        ],
      },
      { p: "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded, including for fraud, or for death or personal injury caused by negligence." },
    ],
  },
  {
    id: "indemnity",
    title: "17. Indemnity",
    blocks: [
      {
        p: `You will defend and indemnify ${C.legalName}, its directors, employees and partners against claims, losses, damages and costs, including reasonable legal fees, arising from Your Content, your documents and transactions, your breach of these Terms or the law, or your infringement of another person's rights. We will tell you promptly of any claim and reasonably cooperate at your expense.`,
      },
    ],
  },
  {
    id: "law",
    title: "18. Governing law and disputes",
    blocks: [
      {
        p: `These Terms are governed by the laws of ${C.governingLaw}, without regard to conflict-of-law rules. Before starting a formal claim, each side agrees to try to resolve the dispute in good faith by writing to the other and allowing 30 days.`,
      },
      {
        p: `If it is not resolved, the dispute will be referred to arbitration seated in ${C.courtsCity}, Nigeria, under the applicable Nigerian arbitration legislation, before a single arbitrator, in English. Either side may go to the courts of ${C.courtsCity} for urgent injunctive relief or to protect intellectual property. To the extent permitted by law, claims must be brought individually and not as a class or representative action.`,
      },
      { p: "If you are a consumer in a country whose mandatory laws give you the right to bring a claim in your home courts, nothing here removes that right." },
    ],
  },
  {
    id: "changes",
    title: "19. Changes to these Terms",
    blocks: [
      {
        p: "We may update these Terms. For material changes we will give at least 14 days' notice by email or in the app before they apply, unless the change is needed sooner for legal or security reasons. If you keep using the Service after the effective date you accept the new Terms. If you do not agree, stop using the Service and delete your account.",
      },
    ],
  },
  {
    id: "general",
    title: "20. General",
    blocks: [
      {
        ul: [
          "Entire agreement: these Terms, the Privacy Policy and any plan or order terms are the whole agreement between us on the Service.",
          "Severability: if a provision is unenforceable, the rest remains in force.",
          "No waiver: not enforcing a right is not a waiver of it.",
          "Assignment: you may not transfer your rights without our written consent. We may assign these Terms in connection with a merger, acquisition or sale of assets.",
          "Force majeure: neither side is liable for failure caused by events beyond its reasonable control, such as natural disasters, power or network failure, strikes, war or government action.",
          "Notices: we may give notice by email, in the app or on our websites. You may give notice to the address in section 22.",
          "No third-party rights: only you and we may enforce these Terms.",
          "Language: the English version controls over any translation.",
        ],
      },
    ],
  },
  {
    id: "export-controls",
    title: "21. Compliance",
    blocks: [
      {
        p: "You agree not to use the Service if you are barred from doing so under applicable sanctions or export laws, and to comply with the laws that apply to your use, including anti-corruption and anti-money-laundering laws.",
      },
    ],
  },
  {
    id: "contact",
    title: "22. Contact",
    blocks: [
      {
        p: `${C.legalName}, ${C.address}. Email: ${C.contactEmail}.`,
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Use"
      updated={C.termsUpdated}
      intro={`These terms set out the rules for using ${C.brand}. Please read them before you create an account.`}
      highlights={[
        `You can try ${C.brand} free for ${C.trialDays} days, then choose a paid plan.`,
        "You own your data and your customers' records. We only use them to run the service.",
        "You are responsible for the accuracy of your invoices and your tax compliance.",
        "Owners control their business and what their staff can do.",
        "You can cancel or delete your account whenever you like.",
      ]}
      sections={sections}
      otherDoc={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}