// components/receipt-templates/ProfessionalTemplate.tsx
//
// "Two-column header with company logo placement and a footer signature
// line. Ideal for enterprises." — matches the card in invoice-templates.tsx.
// Default export, because components/receipt-templates/index.ts imports it as
// `import ProfessionalTemplate from './ProfessionalTemplate'`.
import { resolveCurrency } from '@/utils/currencySymbol';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { DocumentType } from '../../services/documents';
import { colors } from '../../styles/globals';
import { amountToWords } from './pdf/htmlShared';
import { A4ScaledPage } from './A4ScaledPage';
import { ReceiptTemplateProps } from './index';

const TYPE_LABEL: Record<DocumentType, string> = {
  sales_invoice: 'Sales Invoice',
  proforma_invoice: 'Proforma Invoice',
  purchase_invoice: 'Supplier Order',
};

const LABEL = {
  fontSize: 9, color: colors.onSurfaceVariant,
  textTransform: 'uppercase' as const, letterSpacing: 0.7, marginBottom: 3,
};

export default function ProfessionalTemplate({ doc, business }: ReceiptTemplateProps) {
  const brandColor = business.brandColorOne || '#1b2e5e';

  // Prefer the document's own currency, then the business's.
  const resolved = resolveCurrency(doc.currency || business.currency);
  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    const safe = typeof n === 'number' && !isNaN(n) ? n : 0;
    return `${resolved.symbol} ${safe.toLocaleString(undefined, {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;
  };

  const items = doc.items ?? [];
  const billedToName = doc.customerName || doc.supplierName;
  const amountInWords = amountToWords(Number(doc.grandTotal), resolved.name);

  const hasSignatureImage = business.signatureType === 'image' && !!business.signatureUrl;
  const hasSignatureText = business.signatureType === 'text' && !!business.signatureText;

  return (
    <A4ScaledPage>
      <View style={{ backgroundColor: colors.white }}>
        <View style={{ height: 8, backgroundColor: brandColor }} />

        <View style={{ padding: 32 }}>

          {/* ── Two-column header ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', paddingRight: 20 }}>
              {business.logoUrl ? (
                <Image
                  source={{ uri: business.logoUrl }}
                  style={{ width: 56, height: 56, borderRadius: 8, marginRight: 14, backgroundColor: '#f1f3f5' }}
                  contentFit="contain"
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.onSurface }} numberOfLines={2}>
                  {business.name}
                </Text>
                {business.addressOne ? <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 }}>{business.addressOne}</Text> : null}
                {business.addressTwo ? <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{business.addressTwo}</Text> : null}
                {business.phone ? <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{business.phone}</Text> : null}
                {business.email ? <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{business.email}</Text> : null}
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: brandColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                {TYPE_LABEL[doc.documentType]}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.onSurface, marginTop: 6 }}>{doc.documentNumber}</Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>Date: {doc.documentDate}</Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, textTransform: 'capitalize' }}>Status: {doc.status}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#e9ecef', marginBottom: 20 }} />

          {/* ── Bill To + Total due ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 24, gap: 16 }}>
            <View style={{ flex: 1 }}>
              {billedToName ? (
                <>
                  <Text style={LABEL}>Bill To</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurface }}>{billedToName}</Text>
                  {doc.customerPhone ? <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{doc.customerPhone}</Text> : null}
                  {doc.customerEmail ? <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{doc.customerEmail}</Text> : null}
                </>
              ) : null}
            </View>
            <View style={{ minWidth: 200, backgroundColor: `${brandColor}14`, borderRadius: 8, padding: 14, justifyContent: 'center' }}>
              <Text style={{ ...LABEL, color: brandColor }}>Total</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: brandColor }}>{formatCurrency(doc.grandTotal)}</Text>
            </View>
          </View>

          {/* ── Items ── */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: brandColor }}>
              <Text style={{ flex: 0.6, fontSize: 9, fontWeight: '700', color: brandColor, textTransform: 'uppercase' }}>#</Text>
              <Text style={{ flex: 5, fontSize: 9, fontWeight: '700', color: brandColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Text>
              <Text style={{ flex: 2, fontSize: 9, fontWeight: '700', color: brandColor, textTransform: 'uppercase', textAlign: 'right' }}>Rate</Text>
              <Text style={{ flex: 1.2, fontSize: 9, fontWeight: '700', color: brandColor, textTransform: 'uppercase', textAlign: 'right' }}>Qty</Text>
              <Text style={{ flex: 2, fontSize: 9, fontWeight: '700', color: brandColor, textTransform: 'uppercase', textAlign: 'right' }}>Amount</Text>
            </View>
            {items.map((item, idx) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 4,
                  borderBottomWidth: 1, borderBottomColor: '#eef0f3',
                }}
              >
                <Text style={{ flex: 0.6, fontSize: 11, color: colors.onSurfaceVariant }}>{idx + 1}</Text>
                <Text style={{ flex: 5, fontSize: 11, color: colors.onSurface }}>{item.description}</Text>
                <Text style={{ flex: 2, fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={{ flex: 1.2, fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'right' }}>{Number(item.quantity)}</Text>
                <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: colors.onSurface, textAlign: 'right' }}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>

          {/* ── Notes + totals ── */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              {doc.notes ? (
                <View style={{ padding: 12, borderLeftWidth: 3, borderLeftColor: brandColor, backgroundColor: '#f8f9fa' }}>
                  <Text style={{ ...LABEL, color: brandColor, fontWeight: '700' }}>Notes / Payment Info</Text>
                  <Text style={{ fontSize: 11, color: colors.onSurface, lineHeight: 16 }}>{doc.notes}</Text>
                </View>
              ) : null}
            </View>
            <View style={{ width: 240 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>Subtotal</Text>
                <Text style={{ fontSize: 11, color: colors.onSurface }}>{formatCurrency(doc.subtotal)}</Text>
              </View>
              {Number(doc.discount) > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, color: colors.error, textTransform: 'uppercase' }}>Discount</Text>
                  <Text style={{ fontSize: 11, color: colors.error }}>-{formatCurrency(doc.discount)}</Text>
                </View>
              )}
              {Number(doc.taxAmount) > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                    Tax ({(Number(doc.taxRate) * 100).toFixed(0)}%)
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.onSurface }}>{formatCurrency(doc.taxAmount)}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: brandColor, paddingTop: 7, marginTop: 3 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.onSurface, textTransform: 'uppercase' }}>Total</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: brandColor }}>{formatCurrency(doc.grandTotal)}</Text>
              </View>
            </View>
          </View>

          <View style={{ padding: 10, backgroundColor: '#f8f9fa', borderRadius: 6, marginBottom: 36 }}>
            <Text style={{ ...LABEL, marginBottom: 2 }}>Amount in Words</Text>
            <Text style={{ fontSize: 11, fontStyle: 'italic', color: colors.onSurface }}>{amountInWords}</Text>
          </View>

          {/* ── Footer signature line ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ width: 200 }}>
              <View style={{ minHeight: 44, justifyContent: 'flex-end', marginBottom: 4 }}>
                {hasSignatureImage ? (
                  <Image source={{ uri: business.signatureUrl! }} style={{ height: 44, width: 140 }} contentFit="contain" />
                ) : hasSignatureText ? (
                  <Text style={{ fontSize: 22, fontStyle: 'italic', color: colors.onSurface }}>{business.signatureText}</Text>
                ) : null}
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#9aa0ae', paddingTop: 4 }}>
                <Text style={{ fontSize: 9, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.6 }}>Authorized Signature</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurface, marginTop: 1 }}>{business.name}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={LABEL}>Date Signed</Text>
              <Text style={{ fontSize: 11, color: colors.onSurface }}>{doc.documentDate}</Text>
            </View>
          </View>

          {(business.motto || business.registrationNumber) ? (
            <View style={{ marginTop: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e9ecef', alignItems: 'center' }}>
              {business.motto ? <Text style={{ fontSize: 10, fontStyle: 'italic', color: colors.onSurfaceVariant }}>{business.motto}</Text> : null}
              {business.registrationNumber ? <Text style={{ fontSize: 9, color: colors.onSurfaceVariant, marginTop: 2 }}>Reg. No: {business.registrationNumber}</Text> : null}
            </View>
          ) : null}

        </View>
      </View>
    </A4ScaledPage>
  );
}