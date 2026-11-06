'use client';
// A miniature invoice that renders from the owner's real name, logo, colour and currency.
// Everything is sized in container-query units (cqw), so it scales to any width
// (sidebar preview and template cards use the same component).

export type TemplateId = 'modern' | 'classic' | 'minimal' | 'professional';

interface Props {
  template: TemplateId;
  accent: string;
  name: string;
  logoUrl?: string;
  currencySymbol: string;
}

const ROWS = [
  { d: 'Website design', q: 1, r: 120000 },
  { d: 'Hosting, annual', q: 1, r: 35000 },
  { d: 'Consulting hours', q: 4, r: 15000 },
];

const fmt = (symbol: string, n: number) => `${symbol}${n.toLocaleString('en-US')}`;

function Logo({ url, accent, onDark }: { url?: string; accent: string; onDark?: boolean }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-[9cqw] w-[9cqw] rounded-[2cqw] bg-white/20 object-contain" />
  ) : (
    <span
      className="block h-[9cqw] w-[9cqw] rounded-[2cqw]"
      style={{ background: onDark ? 'rgba(255,255,255,0.35)' : accent }}
    />
  );
}

function Header({ template, accent, name, logoUrl }: Omit<Props, 'currencySymbol'>) {
  const label = name.trim() || 'Your business';

  if (template === 'classic') {
    return (
      <div className="flex h-[16cqw]">
        <div className="flex flex-[2] items-center gap-[2.5cqw] bg-[#f4f5f8] px-[5cqw]">
          <Logo url={logoUrl} accent={accent} />
          <span className="truncate text-[4cqw] font-extrabold" style={{ color: accent }}>{label}</span>
        </div>
        <div className="flex flex-1 items-center justify-center text-[3.4cqw] font-bold text-white" style={{ background: accent }}>
          Invoice
        </div>
      </div>
    );
  }

  if (template === 'minimal') {
    return (
      <div>
        <div className="h-[1cqw]" style={{ background: accent }} />
        <div className="flex items-center justify-between px-[5cqw] py-[4.5cqw]">
          <div className="flex items-center gap-[2.5cqw]">
            <Logo url={logoUrl} accent={accent} />
            <span className="truncate text-[4cqw] font-extrabold" style={{ color: accent }}>{label}</span>
          </div>
          <span className="text-[3cqw] text-[#757680]">Invoice</span>
        </div>
      </div>
    );
  }

  if (template === 'professional') {
    return (
      <div>
        <div className="h-[2cqw]" style={{ background: accent }} />
        <div className="flex items-start justify-between px-[5cqw] pt-[4cqw]">
          <div className="flex items-center gap-[2.5cqw]">
            <Logo url={logoUrl} accent={accent} />
            <span className="truncate text-[4cqw] font-extrabold">{label}</span>
          </div>
          <div className="text-right leading-[1.4]">
            <div className="text-[4cqw] font-black uppercase tracking-wider" style={{ color: accent }}>Invoice</div>
            <div className="text-[2.8cqw] font-bold">INV-0001</div>
          </div>
        </div>
        <div className="mx-[5cqw] mt-[3cqw] h-px bg-[#e9ecef]" />
      </div>
    );
  }

  // modern: solid brand header with a wave edge
  return (
    <div className="relative px-[5cqw] pb-[11cqw] pt-[5cqw]" style={{ background: accent }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[2.5cqw]">
          <Logo url={logoUrl} accent={accent} onDark />
          <span className="truncate text-[4cqw] font-extrabold text-white">{label}</span>
        </div>
        <span className="text-[3cqw] text-white/80">Invoice</span>
      </div>
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px block h-[7cqw] w-full" aria-hidden>
        <path d="M0 5 C25 10 45 9 60 6 C78 2 90 3 100 5 V10 H0 Z" fill="#fff" />
      </svg>
    </div>
  );
}

export function InvoicePreview({ template, accent, name, logoUrl, currencySymbol }: Props) {
  const total = ROWS.reduce((s, r) => s + r.q * r.r, 0);
  const isPro = template === 'professional';
  const headFilled = template === 'modern' || template === 'classic';

  return (
    <div className="w-full" style={{ containerType: 'inline-size' }}>
      <div className="overflow-hidden rounded-[2cqw] border border-[#e2e5ef] bg-white text-[#191b24] shadow-[0_18px_40px_-18px_rgba(27,46,94,0.35)]">
        <Header template={template} accent={accent} name={name} logoUrl={logoUrl} />

        <div className="px-[5cqw] pb-[5cqw] pt-[3cqw]">
          <div className="mb-[4cqw] flex justify-between text-[2.8cqw] leading-[1.5] text-[#5f6368]">
            <div>
              <div className="text-[2.4cqw]">Billed to</div>
              <div className="font-bold text-[#191b24]">Adaeze Foods Ltd</div>
              <div>billing@adaeze.example</div>
            </div>
            {isPro ? (
              <div className="min-w-[38%] self-stretch rounded-[1cqw] px-[3cqw] py-[2cqw]" style={{ background: accent + '14', color: accent }}>
                <div className="text-[2.2cqw] uppercase tracking-wider">Total</div>
                <div className="text-[4.2cqw] font-black">{fmt(currencySymbol, total)}</div>
              </div>
            ) : (
              <div className="text-right">
                <div className="font-bold text-[#191b24]">INV-0001</div>
                <div>Paid</div>
              </div>
            )}
          </div>

          <div
            className="flex px-[2.5cqw] py-[1.8cqw] text-[2.4cqw] font-bold"
            style={
              isPro
                ? { color: accent, borderBottom: `0.6cqw solid ${accent}` }
                : headFilled
                  ? { background: accent, color: '#fff', borderRadius: '1cqw' }
                  : { background: accent + '14', color: accent, borderRadius: '1cqw' }
            }
          >
            <span className="flex-[4]">Description</span>
            <span className="flex-1 text-right">Qty</span>
            <span className="flex-[2] text-right">Amount</span>
          </div>
          {ROWS.map((r, i) => (
            <div
              key={r.d}
              className="flex px-[2.5cqw] py-[1.8cqw] text-[2.6cqw]"
              style={isPro ? { borderBottom: '0.3cqw solid #eef0f3' } : { background: i % 2 ? '#f5f6fa' : '#fff' }}
            >
              <span className="flex-[4]">{r.d}</span>
              <span className="flex-1 text-right text-[#5f6368]">{r.q}</span>
              <span className="flex-[2] text-right font-bold">{fmt(currencySymbol, r.q * r.r)}</span>
            </div>
          ))}

          <div
            className="ml-auto mt-[3cqw] flex w-[55%] justify-between px-[2.5cqw] py-[2cqw] text-[3cqw] font-extrabold"
            style={
              isPro
                ? { borderTop: `0.6cqw solid ${accent}`, color: accent }
                : { background: accent + '14', color: accent, borderRadius: '1cqw' }
            }
          >
            <span>Total</span>
            <span>{fmt(currencySymbol, total)}</span>
          </div>
          {isPro && (
            <div className="mt-[6cqw] w-[40%] border-t border-[#9aa0ae] pt-[1cqw] text-[2.2cqw] uppercase tracking-wider text-[#5f6368]">
              Authorized Signature
            </div>
          )}
        </div>
      </div>
    </div>
  );
}