"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormErrors, validateBusinessForm } from "@/lib/validation";
import { SignaturePad } from "@/components/Signaturepad";
import { useDashboardData } from "@/context/DashboardContext";
import { TEMPLATES } from "@/lib/db";
import api from "@/lib/axios";
import Loader from "@/components/Loader";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
];

const uploadToCloudinary = async (fileOrBlob: File | Blob, folder: string) => {
  const form = new FormData();
  form.append("file", fileOrBlob);
  form.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);
  form.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  return data.secure_url;
};

/* Shared input class */
const input = "w-full h-12 px-4 rounded-lg border border-[#dee2e6] bg-white text-[#1b1b1f] focus:border-[#1b2e5e] focus:outline-none transition-colors text-sm";
const inputError = "w-full h-12 px-4 rounded-lg border border-[#ba1a1a] bg-white text-[#1b1b1f] focus:border-[#ba1a1a] focus:outline-none transition-colors text-sm";

export default function BusinessSettings() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const { business, loading: contextLoading, refreshData } = useDashboardData();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    addressOne: "",
    addressTwo: "",
    motto: "",
    phone: "",
    email: "",
    registrationNumber: "",
    logoUrl: "",
    currency: "$",
    taxRate: 0,
    taxEnabled: false,
    signatureUrl: "",
    signatureType: "none" as "none" | "text" | "image",
    signatureText: "",
    brandColorOne: "#1b2e5e",
    brandColorTwo: "#011848",
    selectedTemplateId: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!contextLoading && business) {
      setFormData({
        name: business.name || "",
        email: business.email || "",
        phone: business.phone || "",
        addressOne: business.addressOne || "",
        addressTwo: business.addressTwo || "",
        description: business.description ?? "",
        motto: business.motto ?? "",
        registrationNumber: business.registrationNumber ?? "",
        logoUrl: business.logoUrl ?? "",
        signatureUrl: business.signatureUrl ?? "",
        signatureType: business.signatureType ?? "none",
        signatureText: business.signatureText ?? "",
        currency: business.currency ?? "$",
        taxRate: business.taxRate ?? 0,
        taxEnabled: business.taxEnabled ?? false,
        brandColorOne: business.brandColorOne ?? "#1b2e5e",
        brandColorTwo: business.brandColorTwo ?? "#011848",
        selectedTemplateId: business.selectedTemplateId || "template-modern",
      });
    }
  }, [business, contextLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors((p) => ({ ...p, logoUrl: "Logo must be under 2MB" }));
      return;
    }
    try {
      setSaving(true);
      const url = await uploadToCloudinary(file, "business-logos");
      setFormData((p) => ({ ...p, logoUrl: url }));
    } catch {
      setErrors((p) => ({ ...p, general: "Failed to upload logo." }));
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureCapture = async (blob: Blob) => {
    try {
      setSaving(true);
      const url = await uploadToCloudinary(blob, "business-signatures");
      setFormData((p) => ({ ...p, signatureUrl: url }));
    } catch {
      setErrors((p) => ({ ...p, general: "Failed to upload signature." }));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    const validationErrors = validateBusinessForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await api.patch("/api/business/me/", formData);
      setSuccessMessage("Business profile updated successfully!");
      if (refreshData) await refreshData();
    } catch (err: any) {
      setErrors((p) => ({
        ...p,
        general: err.response?.data?.message || "Failed to save changes.",
      }));
    } finally {
      setSaving(false);
    }
  };

  if (contextLoading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Business Settings</h1>
        <p className="text-sm text-[#45464f] mt-0.5">Manage your brand identity and invoice defaults.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Alerts */}
        {errors.general && (
          <div className="p-4 bg-[#ffdad6] border border-[#f9b4ae] text-[#ba1a1a] rounded-lg text-sm">
            {errors.general}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Section 1: Branding & Identity */}
        <div className="bg-white rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] p-6">
          <h2 className="text-sm font-semibold text-[#1b1b1f] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#1b2e5e] rounded-full"></span>
            Branding &amp; Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Column */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider">
                Business Logo
              </label>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#c5c6d0] rounded-xl bg-[#f5f3f8]">
                {formData.logoUrl ? (
                  <div className="relative group">
                    <img src={formData.logoUrl} alt="Logo" className="w-28 h-28 object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, logoUrl: "" }))}
                      className="absolute -top-2 -right-2 p-1 bg-[#ba1a1a] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto h-10 w-10 text-[#c5c6d0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-sm font-semibold text-[#1b2e5e] hover:underline"
                    >
                      Upload Logo
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
              {errors.logoUrl && <p className="text-xs text-[#ba1a1a]">{errors.logoUrl}</p>}
            </div>

            {/* Colors Column */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider">
                Brand Colors
              </label>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#757680] uppercase tracking-wider">Primary Color</span>
                  <div className="mt-1 flex items-center gap-3 p-2.5 border border-[#c5c6d0] rounded-lg bg-[#f5f3f8]">
                    <input
                      type="color"
                      name="brandColorOne"
                      value={formData.brandColorOne}
                      onChange={handleChange}
                      className="w-9 h-9 rounded-lg border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      name="brandColorOne"
                      value={formData.brandColorOne}
                      onChange={handleChange}
                      className="text-xs font-mono w-full bg-transparent outline-none uppercase text-[#1b1b1f]"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-[#757680] uppercase tracking-wider">Secondary Color</span>
                  <div className="mt-1 flex items-center gap-3 p-2.5 border border-[#c5c6d0] rounded-lg bg-[#f5f3f8]">
                    <input
                      type="color"
                      name="brandColorTwo"
                      value={formData.brandColorTwo}
                      onChange={handleChange}
                      className="w-9 h-9 rounded-lg border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      name="brandColorTwo"
                      value={formData.brandColorTwo}
                      onChange={handleChange}
                      className="text-xs font-mono w-full bg-transparent outline-none uppercase text-[#1b1b1f]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Template Selection (Accordion) */}
        <div className="bg-white rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
            className="w-full p-5 flex items-center justify-between hover:bg-[#f5f3f8] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#eef0f8] text-[#1b2e5e] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-sm font-semibold text-[#1b1b1f]">Receipt Template</h2>
                <p className="text-xs text-[#757680]">
                  Currently:{" "}
                  <span className="font-semibold text-[#1b2e5e] uppercase">
                    {formData.selectedTemplateId.replace("template-", "")}
                  </span>
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-[#757680] transition-transform duration-200 ${isTemplateOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isTemplateOpen && (
            <div className="p-5 border-t border-[#c5c6d0] bg-[#f5f3f8]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, selectedTemplateId: template.id }))}
                    className={`relative p-3 rounded-xl border-2 transition-all bg-white text-left ${
                      formData.selectedTemplateId === template.id
                        ? "border-[#1b2e5e] ring-4 ring-[#1b2e5e]/10 shadow-md"
                        : "border-[#c5c6d0] hover:border-[#1b2e5e]/40"
                    }`}
                  >
                    <div className="aspect-3/4 bg-[#f5f3f8] rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-[#c5c6d0]">
                      {template.id === "template-classic" && (
                        <div className="w-full h-full p-2 bg-white">
                          <div className="h-1.5 w-2/3 bg-[#1b1b1f] mb-1"></div>
                          <div className="h-1 w-1/2 bg-[#c5c6d0] mb-4"></div>
                          <div className="space-y-1">
                            <div className="h-1 w-full bg-[#efedf2]"></div>
                            <div className="h-1 w-full bg-[#efedf2]"></div>
                          </div>
                        </div>
                      )}
                      {template.id === "template-modern" && (
                        <div className="w-full h-full flex flex-col">
                          <div className="h-1/4 bg-[#1b2e5e]"></div>
                          <div className="flex-1 p-2 bg-white space-y-1">
                            <div className="h-1 w-full bg-[#efedf2]"></div>
                            <div className="h-1 w-3/4 bg-[#efedf2]"></div>
                          </div>
                        </div>
                      )}
                      {template.id === "template-compact" && (
                        <div className="w-full h-full p-2 bg-white flex flex-col items-center">
                          <div className="h-1.5 w-1/2 bg-[#1b1b1f] mb-2"></div>
                          <div className="w-full border-t border-dashed border-[#c5c6d0] my-1"></div>
                          <div className="h-1 w-full bg-[#efedf2]"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#1b1b1f] truncate">{template.name}</p>
                    {formData.selectedTemplateId === template.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#1b2e5e] rounded-full flex items-center justify-center shadow">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Business Details */}
        <div className="bg-white rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] p-6">
          <h2 className="text-sm font-semibold text-[#1b1b1f] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
            Business Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                Business Name *
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? inputError : input}
                placeholder="Acme Corp."
              />
              {errors.name && <p className="text-xs text-[#ba1a1a] mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? inputError : input}
                placeholder="contact@acme.com"
              />
              {errors.email && <p className="text-xs text-[#ba1a1a] mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? inputError : input}
                placeholder="+234 800 000 0000"
              />
              {errors.phone && <p className="text-xs text-[#ba1a1a] mt-1">{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                Address Line 1 *
              </label>
              <input
                name="addressOne"
                value={formData.addressOne}
                onChange={handleChange}
                className={errors.addressOne ? inputError : input}
              />
              {errors.addressOne && <p className="text-xs text-[#ba1a1a] mt-1">{errors.addressOne}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                Address Line 2
              </label>
              <input
                name="addressTwo"
                value={formData.addressTwo}
                onChange={handleChange}
                className={input}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                Registration Number
              </label>
              <input
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className={input}
                placeholder="RC-123456"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Invoice Defaults */}
        <div className="bg-white rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] p-6">
          <h2 className="text-sm font-semibold text-[#1b1b1f] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#fece65] rounded-full"></span>
            Invoice Defaults
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                  Default Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={input}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.symbol}>
                      {c.symbol} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                  Default Tax Rate (%)
                </label>
                <div className="flex items-center gap-3 h-12">
                  <input
                    type="checkbox"
                    name="taxEnabled"
                    checked={formData.taxEnabled}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-[#1b2e5e]"
                  />
                  <input
                    type="number"
                    name="taxRate"
                    disabled={!formData.taxEnabled}
                    value={formData.taxRate}
                    onChange={handleChange}
                    className={`${input} disabled:opacity-40 disabled:cursor-not-allowed`}
                  />
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="border-t border-[#e9e7ec] pt-5">
              <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-3">
                Authorized Signature
              </label>
              <div className="flex gap-5 mb-4">
                {["none", "text", "image"].map((type) => (
                  <label key={type} className="flex items-center gap-2 capitalize cursor-pointer text-sm text-[#45464f]">
                    <input
                      type="radio"
                      checked={formData.signatureType === type}
                      onChange={() => setFormData(p => ({ ...p, signatureType: type as any }))}
                      className="accent-[#1b2e5e]"
                    />
                    {type}
                  </label>
                ))}
              </div>

              {formData.signatureType === "text" && (
                <input
                  name="signatureText"
                  value={formData.signatureText}
                  onChange={handleChange}
                  className={input}
                  placeholder="Enter full name for signature"
                />
              )}

              {formData.signatureType === "image" && (
                <div className="max-w-md">
                  {!formData.signatureUrl ? (
                    <SignaturePad onDrawEnd={handleSignatureCapture} />
                  ) : (
                    <div className="relative border border-[#c5c6d0] rounded-lg p-4 bg-[#f5f3f8]">
                      <img src={formData.signatureUrl} alt="Signature" className="h-20 mx-auto" />
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, signatureUrl: "" }))}
                        className="absolute top-2 right-2 text-[#ba1a1a] hover:text-[#93000a] text-xs font-semibold"
                      >
                        Redraw
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 border-t border-[#c5c6d0] pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-semibold text-[#45464f] border border-[#c5c6d0] hover:bg-[#f5f3f8] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-2.5 bg-[#1b2e5e] hover:bg-[#011848] text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)]"
          >
            {saving ? "Saving..." : "Save Business Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
