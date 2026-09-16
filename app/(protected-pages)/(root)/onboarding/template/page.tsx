"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/db";
import api from "@/lib/axios";
import { useDashboardData } from "@/context/DashboardContext";

export default function OnboardingTemplateSelection() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [error, setError] = useState('');
  const { refreshData } = useDashboardData();

  const handleSubmit = async () => {
    if (!selectedTemplate) {
      setError("Please select a template to continue.");
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

      await api.post("/api/business/me/", completeData);
      await refreshData();
      localStorage.removeItem('onboarding-business');
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#1b1b1f] tracking-tight mb-1">
          Choose Your Receipt Template
        </h2>
        <p className="text-sm text-[#45464f]">
          Select a template that best represents your business. You can change this later.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#ffdad6] border border-[#f9b4ae] text-[#ba1a1a] px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => { setSelectedTemplate(template.id); setError(''); }}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              selectedTemplate === template.id
                ? "border-[#1b2e5e] bg-[#eef0f8] shadow-[0px_4px_8px_rgba(27,46,94,0.10)]"
                : "border-[#c5c6d0] bg-white hover:border-[#1b2e5e]/40 hover:shadow-[0px_2px_4px_rgba(27,46,94,0.05)]"
            }`}
          >
            {/* Selected indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[#1b2e5e] rounded-full flex items-center justify-center shadow">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Preview */}
            <div className="aspect-3/4 bg-[#f5f3f8] rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-[#e9e7ec]">
              {template.id === "template-classic" && (
                <div className="w-full h-full p-4 bg-white">
                  <div className="h-3 w-2/3 bg-[#1b1b1f] mb-2"></div>
                  <div className="h-2 w-1/2 bg-[#c5c6d0] mb-4"></div>
                  <div className="border-b border-[#c5c6d0] mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-[#efedf2]"></div>
                    <div className="h-2 w-full bg-[#efedf2]"></div>
                    <div className="h-2 w-3/4 bg-[#efedf2]"></div>
                  </div>
                  <div className="border-t border-[#1b1b1f] mt-4 pt-2">
                    <div className="h-3 w-1/3 bg-[#1b1b1f] ml-auto"></div>
                  </div>
                </div>
              )}
              {template.id === "template-modern" && (
                <div className="w-full h-full">
                  <div className="h-1/4 bg-[#1b2e5e] p-3">
                    <div className="h-2 w-1/2 bg-white/70"></div>
                  </div>
                  <div className="p-3 bg-white h-3/4">
                    <div className="bg-[#f5f3f8] rounded p-2 mb-3">
                      <div className="h-2 w-3/4 bg-[#c5c6d0] mb-1"></div>
                      <div className="h-2 w-1/2 bg-[#c5c6d0]"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-[#efedf2]"></div>
                      <div className="h-2 w-full bg-[#efedf2]"></div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#c5c6d0]">
                      <div className="h-2 w-1/4 bg-[#1b2e5e] ml-auto"></div>
                    </div>
                  </div>
                </div>
              )}
              {template.id === "template-compact" && (
                <div className="w-3/4 h-full p-3 bg-white font-mono">
                  <div className="text-center mb-3">
                    <div className="h-2 w-1/2 bg-[#1b1b1f] mx-auto mb-1"></div>
                    <div className="h-1 w-3/4 bg-[#c5c6d0] mx-auto"></div>
                  </div>
                  <div className="border-t border-dashed border-[#c5c6d0] my-2"></div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-1 w-1/2 bg-[#c5c6d0]"></div>
                      <div className="h-1 w-1/4 bg-[#c5c6d0]"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-1 w-1/3 bg-[#c5c6d0]"></div>
                      <div className="h-1 w-1/4 bg-[#c5c6d0]"></div>
                    </div>
                  </div>
                  <div className="border-t border-double border-[#1b1b1f] mt-3 pt-2">
                    <div className="flex justify-between">
                      <div className="h-2 w-1/4 bg-[#1b1b1f]"></div>
                      <div className="h-2 w-1/4 bg-[#1b1b1f]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <h3 className="font-semibold text-[#1b1b1f] text-sm mb-0.5">{template.name}</h3>
            <p className="text-xs text-[#45464f]">{template.description}</p>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          disabled={saving}
          className="flex-1 h-12 rounded-lg border border-[#c5c6d0] text-[#45464f] text-sm font-semibold hover:bg-[#f5f3f8] transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !selectedTemplate}
          className="flex-1 h-12 rounded-lg bg-[#1b2e5e] hover:bg-[#011848] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0px_2px_4px_rgba(27,46,94,0.15)]"
        >
          {saving ? "Saving..." : "Complete Setup →"}
        </button>
      </div>
    </div>
  );
}
