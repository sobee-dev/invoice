import type { Business, Receipt, ReceiptItem } from '@/lib/types';
import TemplateClassic from './TemplateClassic';
import TemplateModern from './TemplateModern';
import TemplateCompact from './TemplateCompact';
import type { ComponentType } from 'react';

export interface TemplateProps {
  
  business: Business;
  receipt: Receipt;
  items: ReceiptItem[];

}

// Registry mapping templateId → component
const templateRegistry: Record<string, ComponentType<TemplateProps>> = {
  'template-classic': TemplateClassic,
  'template-modern': TemplateModern,
  'template-compact': TemplateCompact,
};

// Default fallback
const DEFAULT_TEMPLATE = 'template-classic';

/**
 * Render a receipt using the specified template
 */
export function ReceiptRenderer({
  templateId,
  business,
  receipt,
  items,
}: TemplateProps & { templateId: string }) {
  const Template = templateRegistry[templateId] ?? templateRegistry[DEFAULT_TEMPLATE];
  return <Template business={business} receipt={receipt} items={items} />;
}

/**
 * Get list of available template IDs
 */
export function getAvailableTemplateIds(): string[] {
  return Object.keys(templateRegistry);
}

/**
 * Check if a template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in templateRegistry;
}

// Re-export individual templates for direct use
export { TemplateClassic, TemplateModern, TemplateCompact };
