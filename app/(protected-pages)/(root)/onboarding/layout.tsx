"use client";

import { usePathname } from "next/navigation";

const STEPS = [
  { path: "/onboarding", label: "Business Info" },
  { path: "/onboarding/template", label: "Choose Template" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStepIndex = STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="min-h-screen bg-[#fbf8fd]">
      {/* Progress Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#c5c6d0]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-base font-bold text-[#1b1b1f] mb-4 text-center tracking-tight">
            Set Up Your Business
          </h1>
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.path} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    index <= currentStepIndex
                      ? "bg-[#1b2e5e] text-white"
                      : "bg-[#efedf2] text-[#757680]"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-xs hidden sm:inline font-medium ${
                    index <= currentStepIndex ? "text-[#1b1b1f]" : "text-[#757680]"
                  }`}
                >
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors ${
                      index < currentStepIndex ? "bg-[#1b2e5e]" : "bg-[#c5c6d0]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
