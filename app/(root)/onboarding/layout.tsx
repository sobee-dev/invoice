"use client";

import { usePathname } from "next/navigation";

const STEPS = [
  { path: "/onboarding", label: "Business Info" },
  { path: "/onboarding/template", label: "Choose Template" },
];

export default function OnboardingLayout({children,}: {children: React.ReactNode;}) {
  
  const pathname = usePathname();
  const currentStepIndex = STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Progress header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">
            Set Up Your Business
          </h1>
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.path} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${
                      index <= currentStepIndex
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }
                  `}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm hidden sm:inline ${
                    index <= currentStepIndex
                      ? "text-slate-900 dark:text-white font-medium"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      index < currentStepIndex
                        ? "bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700"
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
