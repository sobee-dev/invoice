import type { Business, Receipt, ReceiptItem } from '@/lib/types';

interface TemplateProps {
  business: Business;
  receipt: Receipt;
  items: ReceiptItem[];
}

export default function TemplateCompact({ business, receipt, items }: TemplateProps) {
  const formatCurrency = (amount: number) => {
    return `${business.currency} ${amount.toFixed(2)}`;
  };

  // Reconciling address display
  const fullAddress = [business.addressOne, business.addressTwo]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="bg-white max-w-xs mx-auto p-4 font-mono text-sm shadow-lg" id="receipt-printable">
      {/* Header - Centered */}
      <div className="text-center mb-4 pb-3 border-b border-dashed border-gray-400">
        {business.logoUrl && (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="h-10 w-auto mx-auto mb-2 grayscale" // Thermal printers are usually B&W
          />
        )}
        <h1 className="text-base font-bold uppercase">{business.name}</h1>
        {business.motto && <p className="text-[10px] italic text-gray-500">{business.motto}</p>}
        <p className="text-xs text-gray-600 whitespace-pre-line">{fullAddress}</p>
        <p className="text-xs text-gray-600">{business.phone}</p>
        {business.registrationNumber && (
          <p className="text-xs text-gray-500">Reg: {business.registrationNumber}</p>
        )}
      </div>

      {/* Receipt Info */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between">
          <span>Receipt:</span>
          <span className="font-bold">{receipt.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{receipt.receiptDate}</span>
        </div>
        {receipt.customerName && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{receipt.customerName}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Items */}
      <div className="mb-2">
        {items.map((item) => (
          <div key={item.id} className="mb-2">
            <div className="font-medium">{item.description}</div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
              <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Totals */}
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(receipt.subtotal)}</span>
        </div>
        {receipt.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({(receipt.taxRate * 100).toFixed(0)}%):</span>
            <span>{formatCurrency(receipt.taxAmount)}</span>
          </div>
        )}
        {receipt.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{formatCurrency(receipt.discount)}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="border-t border-double border-gray-600 mt-2 pt-2">
        <div className="flex justify-between text-base font-bold">
          <span>TOTAL:</span>
          <span>{formatCurrency(receipt.grandTotal)}</span>
        </div>
      </div>

      {/* Signature Section - Compact */}
      {business.signatureType !== 'none' && (
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-400 mb-1">Signature</p>
          {business.signatureType === 'image' && business.signatureUrl ? (
            <img src={business.signatureUrl} alt="Signature" className="h-8 w-auto mx-auto grayscale" />
          ) : (
            <p className="font-serif italic text-sm">{business.signatureText}</p>
          )}
        </div>
      )}

      {/* Notes */}
      {receipt.notes && (
        <div className="mt-3 pt-2 border-t border-dashed border-gray-400">
          <p className="text-xs text-gray-600 whitespace-pre-line">{receipt.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-dashed border-gray-400 text-center">
        {receipt.isPaid && <p className="text-xs font-bold uppercase mb-1">*** PAID ***</p>}
        <p className="text-xs">Thank you!</p>
        <p className="text-xs text-gray-500 mt-1">*** {business.name} ***</p>
      </div>
    </div>
  );
}