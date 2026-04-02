import type { Business, Receipt, ReceiptItem } from '@/lib/types';

interface TemplateProps {
  business: Business;
  receipt: Receipt;
  items: ReceiptItem[];
}

export default function TemplateClassic({ business, receipt, items }: TemplateProps) {
  const formatCurrency = (amount: number) => {
    return `${business.currency} ${amount.toFixed(2)}`;
  };

  // Reconciling address display
  const fullAddress = [business.addressOne, business.addressTwo]
    .filter(Boolean)
    .join('\n');

  return (
    <div 
      className="bg-white p-8 max-w-2xl mx-auto shadow-lg" 
      id="receipt-printable"
      style={{ borderTop: `4px solid ${business.brandColorOne}` }} // Using brand color
    >
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            {business.logoUrl && (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="h-16 w-auto mb-2 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            {business.motto && <p className="text-xs italic text-gray-500 mb-1">{business.motto}</p>}
            <p className="text-sm text-gray-600 whitespace-pre-line">{fullAddress}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold" style={{ color: business.brandColorOne }}>RECEIPT</h2>
            <p className="text-lg font-mono text-gray-700">{receipt.receiptNumber}</p>
            <p className="text-sm text-gray-600">{receipt.receiptDate}</p>
          </div>
        </div>
      </div>

      {/* Business Contact */}
      <div className="mb-6 text-sm text-gray-600 grid grid-cols-2 gap-2">
        <div>
          <p><span className="font-semibold">Phone:</span> {business.phone}</p>
          <p><span className="font-semibold">Email:</span> {business.email}</p>
        </div>
        <div className="text-right">
          {business.registrationNumber && (
            <p><span className="font-semibold">Reg No:</span> {business.registrationNumber}</p>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold text-gray-800 mb-2">Bill To:</h3>
        <p className="font-medium text-gray-900">{receipt.customerName}</p>
        {receipt.customerPhone && <p className="text-sm text-gray-600">{receipt.customerPhone}</p>}
        {receipt.customerEmail && <p className="text-sm text-gray-600">{receipt.customerEmail}</p>}
      </div>

      {/* Items Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 text-gray-700">Description</th>
            <th className="text-center py-2 text-gray-700 w-20">Qty</th>
            <th className="text-right py-2 text-gray-700 w-28">Price</th>
            <th className="text-right py-2 text-gray-700 w-28">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3 text-gray-900">{item.description}</td>
              <td className="py-3 text-center text-gray-700">{item.quantity}</td>
              <td className="py-3 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Signature Section */}
      <div className="flex justify-between items-end">
        {/* Signature Area */}
        <div className="w-1/2">
          {business.signatureType !== 'none' && (
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-2">Authorized Signature</p>
              {business.signatureType === 'image' && business.signatureUrl ? (
                <img src={business.signatureUrl} alt="Signature" className="h-12 w-auto border-b border-gray-400" />
              ) : (
                <p className="font-serif text-xl border-b border-gray-400 inline-block px-4">
                  {business.signatureText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(receipt.subtotal)}</span>
          </div>
          {receipt.taxAmount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Tax ({(receipt.taxRate * 100).toFixed(0)}%)</span>
              <span className="text-gray-900">{formatCurrency(receipt.taxAmount)}</span>
            </div>
          )}
          {receipt.discount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Discount</span>
              <span className="text-red-600">-{formatCurrency(receipt.discount)}</span>
            </div>
          )}
          <div 
            className="flex justify-between py-3 border-t-2 mt-2"
            style={{ borderColor: business.brandColorTwo }}
          >
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(receipt.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {receipt.notes && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold text-gray-800 mb-1">Notes:</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">{receipt.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
        {receipt.isPaid && receipt.paidAt && (
            <p className="mt-1 font-bold text-green-600">PAID ON: {receipt.paidAt}</p>
        )}
      </div>
    </div>
  );
}