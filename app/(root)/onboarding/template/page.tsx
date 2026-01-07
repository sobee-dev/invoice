"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/db";

export default function OnboardingTemplateSelection() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [error, setError] = useState('');


  const handleSubmit = async () => {
    if (!selectedTemplate) {
      setError("Please select a template");
      return;
    }

    setSaving(true);
    setError('');

    try {
      const businessData = JSON.parse(
        localStorage.getItem('onboarding-business') || '{}'
      );

      const completeData = {
        ...businessData,
        selectedTemplateId: selectedTemplate,
        onboardingComplete: true,
      
      };

      // ✅ Post to Django
      const response = await fetch('http://localhost:8000/api/business/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth if needed: 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(completeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save');
      }

      const business = await response.json();
      
      // ✅ Clear localStorage
      localStorage.removeItem('onboarding-business');
      
      // ✅ Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }

  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Choose Your Receipt Template
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Select a template that best represents your business. You can change this later.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelectedTemplate(template.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all text-left
              ${
                selectedTemplate === template.id
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }
            `}
          >
            {/* Selection indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}

            {/* Template Preview Placeholder */}
            <div className="aspect-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {/* Simple visual preview based on template type */}

              {template.id === "template-classic" && (
                <div className="w-full h-full p-4 bg-white">
                  <div className="h-3 w-2/3 bg-slate-800 mb-2"></div>
                  <div className="h-2 w-1/2 bg-slate-300 mb-4"></div>
                  <div className="border-b border-slate-300 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-200"></div>
                    <div className="h-2 w-full bg-slate-200"></div>
                    <div className="h-2 w-3/4 bg-slate-200"></div>
                  </div>
                  <div className="border-t border-slate-800 mt-4 pt-2">
                    <div className="h-3 w-1/3 bg-slate-800 ml-auto"></div>
                  </div>
                </div>
              )}
              
              {template.id === "template-modern" && (
                <div className="w-full h-full">
                  <div className="h-1/4 bg-blue-600 p-3">
                    <div className="h-2 w-1/2 bg-white/80"></div>
                  </div>
                  <div className="p-3 bg-white h-3/4">
                    <div className="bg-slate-100 rounded p-2 mb-3">
                      <div className="h-2 w-3/4 bg-slate-300 mb-1"></div>
                      <div className="h-2 w-1/2 bg-slate-300"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-200"></div>
                      <div className="h-2 w-full bg-slate-200"></div>
                    </div>
                    <div className="mt-3 pt-2 border-t">
                      <div className="h-2 w-1/4 bg-blue-600 ml-auto"></div>
                    </div>
                  </div>
                </div>
              )}
              {template.id === "template-compact" && (
                <div className="w-3/4 h-full p-3 bg-white font-mono">
                  <div className="text-center mb-3">
                    <div className="h-2 w-1/2 bg-slate-800 mx-auto mb-1"></div>
                    <div className="h-1 w-3/4 bg-slate-300 mx-auto"></div>
                  </div>
                  <div className="border-t border-dashed border-slate-400 my-2"></div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-1 w-1/2 bg-slate-400"></div>
                      <div className="h-1 w-1/4 bg-slate-400"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-1 w-1/3 bg-slate-400"></div>
                      <div className="h-1 w-1/4 bg-slate-400"></div>
                    </div>
                  </div>
                  <div className="border-t border-double border-slate-600 mt-3 pt-2">
                    <div className="flex justify-between">
                      <div className="h-2 w-1/4 bg-slate-800"></div>
                      <div className="h-2 w-1/4 bg-slate-800"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Template Info */}
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              {template.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {template.description}
            </p>
          </button>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          disabled={saving}
          className="flex-1 h-14 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !selectedTemplate}
          className="flex-1 h-14 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
}