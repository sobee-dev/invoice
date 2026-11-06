// components/legal/LegalDocument.tsx
import Link from "next/link";
import { COMPANY, type Block, type LegalSection } from "@/lib/legal";

interface LegalDocumentProps {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  highlightsTitle?: string;
  highlights?: string[];
  sections: LegalSection[];
  otherDoc: { href: string; label: string };
}

function renderBlock(block: Block, i: number) {
  if ("h" in block) {
    return (
      <h3 key={i} className="mt-6 text-sm font-semibold text-[#1b2e5e]">
        {block.h}
      </h3>
    );
  }
  if ("p" in block) {
    return (
      <p key={i} className="mt-3 text-sm leading-relaxed text-[#45464f]">
        {block.p}
      </p>
    );
  }
  return (
    <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#45464f] marker:text-[#757680]">
      {block.ul.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalDocument({
  eyebrow,
  title,
  updated,
  intro,
  highlightsTitle,
  highlights,
  sections,
  otherDoc,
}: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-[#fbf8fd] text-[#1b1b1f]">
      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#c5c6d0] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1b2e5e]">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight">{COMPANY.brand}</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#45464f] transition-colors hover:text-[#1b2e5e]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-[#c5c6d0] bg-white px-6 pb-12 pt-28">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs font-semibold text-[#1b2e5e]">{eyebrow}</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="max-w-3xl text-base leading-relaxed text-[#45464f]">{intro}</p>
          <p className="mt-4 text-sm text-[#757680]">Last updated: {updated}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[240px_1fr]">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <p className="mb-3 text-xs font-semibold text-[#757680]">On this page</p>
            <ol className="space-y-2 border-l border-[#c5c6d0] text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-3 text-[#45464f] transition-colors hover:border-[#1b2e5e] hover:text-[#1b2e5e]">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className="min-w-0 max-w-3xl">
          {highlights && highlights.length > 0 && (
            <div className="mb-12 rounded-xl border border-[#c5c6d0] bg-[#eef0f8] p-6">
              <h2 className="mb-3 text-sm font-bold text-[#1b2e5e]">{highlightsTitle ?? "The short version"}</h2>
              <ul className="space-y-2 text-sm text-[#45464f]">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1b2e5e] text-[10px] font-bold text-white" aria-hidden="true">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[#757680]">
                This summary is for convenience only. The full document below is what applies.
              </p>
            </div>
          )}

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="border-b border-[#c5c6d0] pb-3 text-lg font-bold">{section.title}</h2>
                {section.blocks.map(renderBlock)}
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 rounded-xl border border-[#c5c6d0] bg-white p-6 text-center shadow-[0px_2px_4px_rgba(27,46,94,0.05)]">
            <h3 className="mb-2 text-sm font-bold">Questions about this document?</h3>
            <p className="mb-4 text-sm text-[#45464f]">Write to us and we will reply as soon as we can.</p>
            <a
              href={`mailto:${COMPANY.contactEmail}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1b2e5e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#011848]"
            >
              {COMPANY.contactEmail}
            </a>
          </div>

          <div className="mt-8 text-center">
            <Link href={otherDoc.href} className="text-sm font-semibold text-[#1b2e5e] hover:underline">
              Read our {otherDoc.label}
            </Link>
          </div>
        </main>
      </div>

      <footer className="border-t border-[#c5c6d0] bg-white px-6 py-8 text-center">
        <p className="text-sm text-[#757680]">
          © {new Date().getFullYear()} {COMPANY.brand}. All rights reserved.
          {" · "}
          <Link href="/privacy" className="transition-colors hover:text-[#1b2e5e]">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="transition-colors hover:text-[#1b2e5e]">Terms of Use</Link>
        </p>
      </footer>
    </div>
  );
}