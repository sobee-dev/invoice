import type { Business, Receipt, ReceiptItem } from '@/lib/types';

interface TemplateProps {
  business: Business;
  receipt: Receipt;
  items: ReceiptItem[];
}

export default function TemplateModern({ business, receipt, items }: TemplateProps) {
  const formatCurrency = (amount: number) => {
    return `${business.currency} ${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white max-w-2xl mx-auto shadow-xl rounded-2xl overflow-hidden" id="receipt-printable">
      {/* Header - Bold color block */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            {business.logo && (
              <img
                src={business.logo}
                alt={business.name}
                className="h-12 w-auto mb-3 brightness-0 invert"
              />
            )}
            <h1 className="text-3xl font-extrabold tracking-tight">{business.name}</h1>
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-2">
              RECEIPT
            </span>
            <p className="text-2xl font-mono font-bold">{receipt.receiptNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Meta info bar */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Date</p>
            <p className="font-semibold text-gray-800">{receipt.receiptDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Business Contact</p>
            <p className="text-sm text-gray-600">{business.phone}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
          <p className="text-xl font-bold text-gray-900">{receipt.customerName}</p>
          {receipt.customerPhone && (
            <p className="text-gray-600">{receipt.customerPhone}</p>
          )}
          {receipt.customerEmail && (
            <p className="text-gray-600">{receipt.customerEmail}</p>
          )}
        </div>

        {/* Items */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs text-gray-500 uppercase tracking-wider font-medium border-b border-gray-200">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 last:border-0">
                <div className="col-span-6 font-medium text-gray-900">{item.description}</div>
                <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                <div className="col-span-2 text-right text-gray-600">{formatCurrency(item.unitPrice)}</div>
                <div className="col-span-2 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(receipt.subtotal)}</span>
            </div>
            {receipt.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({(receipt.taxRate * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(receipt.taxAmount)}</span>
              </div>
            )}
            {receipt.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-{formatCurrency(receipt.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(receipt.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <p className="text-xs text-yellow-600 uppercase tracking-wider font-medium mb-1">Notes</p>
            <p className="text-sm text-yellow-800 whitespace-pre-line">{receipt.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-8 py-4 text-center">
        <p className="text-sm text-gray-500">Thank you for choosing {business.name}!</p>
        {business.registrationNumber && (
          <p className="text-xs text-gray-400 mt-1">Reg. No: {business.registrationNumber}</p>
        )}
      </div>
    </div>
  );
}
