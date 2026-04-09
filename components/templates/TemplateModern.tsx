import type { Business, Receipt, ReceiptItem } from '@/lib/types';
import { getContrastColor } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { numberToWords, resolveCurrencyName } from '@/lib/utils';

interface TemplateProps {
  business: Business;
  receipt: Receipt;
  items: ReceiptItem[];
}

export default function TemplateModern({ business, receipt, items }: TemplateProps) {
  const brandColorOne = business.brandColorOne || '#d3aeae';
  const nameRef = useRef<HTMLHeadingElement>(null);
  const currencyName = resolveCurrencyName(business.currency);
  const amountInWords = numberToWords(receipt.grandTotal, currencyName);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;

    const min = 16;
    const max = 64;

    let lo = min, hi = max;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      el.style.fontSize = `${mid}px`;
      if (el.scrollWidth <= el.offsetWidth) lo = mid;
      else hi = mid - 1;
    }
  }, [business.name]);
  


  const formatCurrency = (amount: number) => {
    return `${business.currency} ${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <div className="bg-white max-w-3xl mx-auto shadow-sm" id="receipt-printable">

      
      <div className ='px-4  py-2' >


        <div className="relative  w-full py-3 h-auto flex items-center px-2">

        
          {business.logoUrl && (
            <div className="absolute left-4 z-10">
              <img
                src={business.logoUrl}
                alt=""
                className="h-14 w-14 object-contain mix-blend-multiply"
              />
            </div>
          )}

          
          <div className="w-full text-center z-10 ">
            <h1 
              ref={nameRef}  
              className="pl-20 font-black uppercase tracking-tighter whitespace-nowrap text-white leading-[0.9]
                  text-[clamp(1.5rem,6vw,4rem)] "
                style={{ color: brandColorOne }}>
              {business.name}
            </h1>
          </div>

        </div>

        <p className="pl-20 text-sm mb-4 text-center font-mono font-bold">{business.description}</p>

        <div className="flex justify-between items-center mb-2 pb-1.5 border-b " style={{ borderColor: brandColorOne }}>
          <div className="" >
            <p className="text-xs text-gray-400 uppercase tracking-wider">head office</p>
            <p className="mb-1 font-semibold text-gray-800">{business.addressOne}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">date</p>
            <p className="font-semibold text-gray-800">{receipt.receiptDate}</p>
            
          </div>

          <div className="p-2 rounded-xl" style={{ 
              backgroundColor: `${business.brandColorOne}08` || '#F9FAFB'
            }}>
            <p className="text-sm p-1.5 font-mono font-bold"> Sales Invoice</p>
            <p className="text-sm rounded-2xl  text-center  p-1.5 font-mono font-bold"> {receipt.receiptNumber}</p>
          </div>

          <div className="text-right">
            {business.addressTwo && (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wider">branch office</p>
                <p className="font-semibold text-gray-800">{business.addressTwo}</p>
              </>
            )}
            <p className="text-xs text-gray-600 uppercase tracking-wider">Business Contact</p>
            <p className="text-sm text-gray-800">{business.phone}</p>
          </div>
        </div>
        
      </div>


     
      <div className="p-6">
        

        {/* Customer */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Billed To</p>
          <p className="text-lg font-bold text-gray-900">{receipt.customerName}</p>
          {receipt.customerPhone && (
            <p className="text-gray-600">{receipt.customerPhone}</p>
          )}
          {receipt.customerEmail && (
            <p className="text-gray-600">{receipt.customerEmail}</p>
          )}
        </div>

        {/* Items */}
        <div className="mb-5">

          <div className=" rounded-xl" style={{
              backgroundColor: `${business.brandColorOne}08` || '#F9FAFB'
            }}>
            
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-xs text-gray-500 uppercase tracking-wider font-medium border-b border-gray-200">
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            {items.map((item) => (
              // Row: padding reduced from p-4 → px-4 py-2, text nudged to text-sm so more rows fit
              <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-100 last:border-0 text-sm">
                <div className="col-span-5 font-medium text-gray-900">{item.description}</div>
                <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                <div className="col-span-2 text-right text-gray-600">{formatCurrency(item.unitPrice)}</div>
                <div className="col-span-3 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</div>
              </div>
            ))}
          </div>

        </div>

        {/* Totals */}
        <div className="flex justify-end mb-2">
          <div className="w-72 space-y-1.5">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(receipt.subtotal)}</span>
            </div>
            {receipt.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tax ({(receipt.taxRate * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(receipt.taxAmount)}</span>
              </div>
            )}
            {receipt.discount > 0 && (
              <div className="flex justify-between text-red-500 text-sm">
                <span>Discount</span>
                <span>-{formatCurrency(receipt.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-xl font-bold " style={{ color: business.brandColorOne }}>Total</span>
              <span className="text-xl font-bold " style={{ color: business.brandColorOne }}>{formatCurrency(receipt.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 ml-auto border-t w-1/2 text-right border-dashed border-gray-200" 
         style={{ 
              borderColor: business.brandColorOne || '#E5E7EB',
              backgroundColor: `${business.brandColorOne}07` || '#F9FAFB'
            }}>
            <p className="  text-[14px] font-bold text-gray-800 uppercase mb-0.5" > Amount in words</p>
            <p className="text-[13px] font-medium text-gray-600 italic leading-snug" 
              >
              {amountInWords}
            </p>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div 
            className="p-3 rounded-xl border" 
            style={{ 
              borderColor: business.brandColorOne || '#E5E7EB',
              backgroundColor: `${business.brandColorOne}08` || '#F9FAFB'
            }}
          >
            <p 
              className="text-xs uppercase tracking-wider font-medium mb-1"
              style={{ color: business.brandColorOne }}
            >
              Notes
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {receipt.notes}
            </p>
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div className="mt-3 px-6 pb-6 flex justify-end">
        <div className="text-center w-56">
          <div className="relative min-h-[40px] flex items-end justify-center mb-1">
            {business.signatureUrl ? (
              <img 
                src={business.signatureUrl} 
                alt="Signature" 
                className="max-h-12 w-auto object-contain mix-blend-multiply"
              />
            ) : (
              <span className="text-2xl font-serif italic text-gray-700 tracking-tight" 
                    style={{ fontFamily: "'Dancing Script', 'Cursive', serif" }}>
                {business.name}
              </span>
            )}
          </div>
          
          <div className="border-t border-gray-400 pt-1">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
              Authorized Signature
            </p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase italic">
              {business.name}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-8 py-3 text-center">
        <p className="text-sm text-gray-500">Thank you for choosing {business.name}!</p>
        {business.registrationNumber && (
          <p className="text-xs text-gray-400 mt-1">Reg. No: {business.registrationNumber}</p>
        )}
      </div>
    </div>
  );
}