// components/receipt-templates/pdf/index.ts
//
// PDF-export twin of components/receipt-templates/index.ts. Same
// selection logic (purchase orders always get their own layout,
// irrespective of the business's chosen customer-facing template) but
// resolving to an HTML-builder function instead of a React component.

import { DEFAULT_TEMPLATE_ID, effectiveTemplateId } from '@/lib/plan';
import { SubscriptionInfo } from '../../../services/billing';
import { BusinessProfile } from '../../../services/business';
import { Document, DocumentType } from '../../../services/documents';
import { TemplateId } from '../index';
import { buildClassicHtml } from './classicHtml';
import { buildMinimalHtml } from './minimalHtml';
import { buildModernHtml } from './modernHtml';
import { injectPlanFooter } from './planFooter';
import { buildProfessionalHtml } from './professionalHtml';
import { buildPurchaseOrderHtml } from './purchaseOrderHtml';


type HtmlBuilder = (doc: Document, business: BusinessProfile) => string;

const HTML_TEMPLATES: Record<TemplateId, HtmlBuilder> = {
  classic: buildClassicHtml,
  modern:  buildModernHtml,
  minimal: buildMinimalHtml,
  professional: buildProfessionalHtml,
};

// subscription null means the plan is unknown. That is treated as Free, so the
// document never goes out without the footer because a status call failed.
export function getInvoiceHtml(
  templateId: string | undefined,
  documentType: DocumentType | undefined,
  doc: Document,
  business: BusinessProfile,
  subscription: SubscriptionInfo | null,
): string {
  const free = !subscription || subscription.plan === 'free';

  let html: string;
  if (documentType === 'purchase_invoice') {
    // Purchase orders always use their own supplier-facing layout.
    html = buildPurchaseOrderHtml(doc, business);
  } else {
    const id = subscription ? effectiveTemplateId(subscription, templateId) : DEFAULT_TEMPLATE_ID;
    const builder = HTML_TEMPLATES[id as TemplateId] ?? HTML_TEMPLATES.classic;
    html = builder(doc, business);
  }

  return free ? injectPlanFooter(html) : html;
}