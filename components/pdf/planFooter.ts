// components/templates/pdf/planFooter.ts
//
// The "Made with BillBuzz" footer for Free. It is injected once, in
// getInvoiceHtml, so every template and the supplier order carry it
// without five separate edits.

const FOOTER = `
<div class="avoid-break" style="margin:24px 32px 0; padding:10px 0 18px; border-top:1px solid #e9ecef; text-align:center; font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-size:10px; letter-spacing:0.4px; color:#9ca3af;">
  Made with BillBuzz
</div>`;

export function injectPlanFooter(html: string): string {
  const at = html.lastIndexOf('</body>');
  return at === -1 ? html + FOOTER : html.slice(0, at) + FOOTER + html.slice(at);
}