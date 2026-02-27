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
    currency: "USD",
    taxRate: 0,
    taxEnabled: false,
    signatureUrl: "",
    signatureType: "none" as "none" | "text" | "image",
    signatureText: "",
    brandColorOne: "#3b82f6",
    brandColorTwo: "#1e293b",
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
        currency: business.currency ?? "USD",
        taxRate: business.taxRate ?? 0,
        taxEnabled: business.taxEnabled ?? false,
        brandColorOne: business.brandColorOne ?? "#3b82f6",
        brandColorTwo: business.brandColorTwo ?? "#1e293b",
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
    } catch (err) {
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
    } catch (err) {
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
      setErrors((p) => ({ ...p, general: err.response?.data?.message || "Failed to save changes." }));
    } finally {
      setSaving(false);
    }
  };

  if (contextLoading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your brand identity and invoice defaults.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Alerts */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {errors.general}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Section 1: Identity & Branding */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Branding & Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo Column */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Logo</label>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                {formData.logoUrl ? (
                  <div className="relative group">
                    <img src={formData.logoUrl} alt="Logo" className="w-32 h-32 object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, logoUrl: "" }))}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-sm text-blue-600 font-medium"
                    >
                      Upload Logo
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>

            {/* Colors Column */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand Colors</label>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Primary Color</span>
                  <div className="mt-1 flex items-center gap-3 p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                   <input type="color" name="brandColorOne" value={formData.brandColorOne} onChange={handleChange} className="w-10 h-10 rounded-lg border-none bg-transparent cursor-pointer" />
                   <input type="text" name="brandColorOne" value={formData.brandColorOne} onChange={handleChange} className="text-xs font-mono w-full bg-transparent outline-none uppercase" />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Secondary Color</span>
                  <div className="mt-1 flex items-center gap-3 p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <input type="color" name="brandColorTwo" value={formData.brandColorTwo} onChange={handleChange} className="w-10 h-10 rounded-lg border-none bg-transparent cursor-pointer" />
                    <input type="text" name="brandColorTwo" value={formData.brandColorTwo} onChange={handleChange} className="text-xs font-mono w-full bg-transparent outline-none uppercase" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: TEMPLATE SELECTION (ACCORDION) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold">Receipt Template</h2>
                <p className="text-xs text-slate-500">Currently using: <span className="font-bold text-purple-600 uppercase">{formData.selectedTemplateId.replace('template-', '')}</span></p>
              </div>
            </div>
            <svg className={`w-6 h-6 transition-transform duration-300 ${isTemplateOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {isTemplateOpen && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, selectedTemplateId: template.id }))}
                    className={`relative p-3 rounded-2xl border-2 transition-all bg-white dark:bg-slate-800 text-left ${formData.selectedTemplateId === template.id ? "border-blue-600 ring-4 ring-blue-500/10 shadow-lg" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
                  >
                    <div className="aspect-3/4 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                       {/* Simplified Visuals from your onboarding code */}
                       {template.id === "template-classic" && <div className="w-full h-full p-2 bg-white"><div className="h-1.5 w-2/3 bg-slate-800 mb-1"></div><div className="h-1 w-1/2 bg-slate-300 mb-4"></div><div className="space-y-1"><div className="h-1 w-full bg-slate-200"></div><div className="h-1 w-full bg-slate-200"></div></div></div>}
                       {template.id === "template-modern" && <div className="w-full h-full flex flex-col"><div className="h-1/4 bg-blue-600"></div><div className="flex-1 p-2 bg-white space-y-1"><div className="h-1 w-full bg-slate-200"></div><div className="h-1 w-3/4 bg-slate-200"></div></div></div>}
                       {template.id === "template-compact" && <div className="w-full h-full p-2 bg-white flex flex-col items-center"><div className="h-1.5 w-1/2 bg-slate-800 mb-2"></div><div className="w-full border-t border-dashed border-slate-300 my-1"></div><div className="h-1 w-full bg-slate-100"></div></div>}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{template.name}</p>
                    {formData.selectedTemplateId === template.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: General Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-600 rounded-full"></span>
            Business Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Business Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full h-11 px-4 rounded-lg border ${errors.name ? "border-red-500" : "border-slate-300 dark:border-slate-600"} bg-transparent`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address *</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
              <input
                name="addressOne"
                value={formData.addressOne}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Address Line 2</label>
              <input
                name="addressTwo"
                value={formData.addressTwo}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Registration Number</label>
              <input
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
              />
            </div>
          </div>
        </div>

        

        {/* Section 3: Financial Defaults */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-600 rounded-full"></span>
            Invoice Defaults
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Default Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Tax Rate (%)</label>
                <div className="flex items-center gap-3 h-11">
                  <input
                    type="checkbox"
                    name="taxEnabled"
                    checked={formData.taxEnabled}
                    onChange={handleChange}
                    className="w-5 h-5 rounded"
                  />
                  <input
                    type="number"
                    name="taxRate"
                    disabled={!formData.taxEnabled}
                    value={formData.taxRate}
                    onChange={handleChange}
                    className="w-full h-full px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Signature Pad Integration */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <label className="block text-sm font-medium mb-4">Authorized Signature</label>
              <div className="flex gap-6 mb-4">
                {["none", "text", "image"].map((type) => (
                  <label key={type} className="flex items-center gap-2 capitalize cursor-pointer text-sm">
                    <input
                      type="radio"
                      checked={formData.signatureType === type}
                      onChange={() => setFormData(p => ({ ...p, signatureType: type as any }))}
                      className="text-blue-600"
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
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                  placeholder="Enter full name for signature"
                />
              )}

              {formData.signatureType === "image" && (
                <div className="max-w-md">
                  {!formData.signatureUrl ? (
                    <SignaturePad onDrawEnd={handleSignatureCapture} />
                  ) : (
                    <div className="relative border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                      <img src={formData.signatureUrl} alt="Signature" className="h-20 mx-auto" />
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, signatureUrl: "" }))}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
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
        <div className="flex items-center justify-end gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm shadow-blue-200"
          >
            {saving ? "Saving Changes..." : "Save Business Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}