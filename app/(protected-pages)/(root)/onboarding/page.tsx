"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormErrors, validateBusinessForm } from "@/lib/validation";
import { SignaturePad } from "@/components/Signaturepad";
import { useDashboardData } from "@/context/DashboardContext";
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

const inputCls = "w-full h-12 px-4 rounded-lg border border-[#dee2e6] bg-white text-[#1b1b1f] focus:border-[#1b2e5e] focus:outline-none transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5";

export default function OnboardingBusinessInfo() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const { user, business, loading: contextLoading } = useDashboardData();

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
  });

  useEffect(() => {
    if (!contextLoading && (user || business)) {
      setFormData((prev) => ({
        ...prev,
        name: business?.name || "",
        email: business?.email || user?.email || "",
        phone: business?.phone || "",
        addressOne: business?.addressOne || "",
        addressTwo: business?.addressTwo || "",
        description: business?.description ?? "",
        motto: business?.motto ?? "",
        registrationNumber: business?.registrationNumber ?? "",
        logoUrl: business?.logoUrl ?? "",
        signatureUrl: business?.signatureUrl ?? "",
        signatureType: business?.signatureType ?? "none",
        signatureText: business?.signatureText ?? "",
        currency: business?.currency ?? "$",
        taxRate: business?.taxRate ?? 0,
        taxEnabled: business?.taxEnabled ?? false,
      }));
    }
  }, [user, business, contextLoading]);

  const [errors, setErrors] = useState<FormErrors>({});

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
      setFormData(p => ({ ...p, logoUrl: url }));
    } catch {
      setErrors(p => ({ ...p, general: "Failed to upload logo. Please try again." }));
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureCapture = async (blob: Blob) => {
    try {
      setSaving(true);
      setErrors((prev) => ({ ...prev, general: "" }));
      const url = await uploadToCloudinary(blob, "business-signatures");
      setFormData(p => ({ ...p, signatureUrl: url, signatureType: "image" }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: "Failed to upload signature. Please try drawing it again.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSignature = () => {
    setFormData((prev) => ({ ...prev, signatureUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateBusinessForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    localStorage.setItem('onboarding-business', JSON.stringify(formData));
    router.push("/onboarding/template");
  };

  if (contextLoading) return <Loader />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* General error */}
      {errors.general && (
        <div className="bg-[#ffdad6] border border-[#f9b4ae] text-[#ba1a1a] px-4 py-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}

      {/* Business Information Card */}
      <div className="bg-white rounded-xl p-5 shadow-[0px_2px_4px_rgba(27,46,94,0.05)] border border-[#c5c6d0]">
        <h2 className="text-sm font-semibold text-[#1b1b1f] mb-5">Business Information</h2>

        {/* Logo Upload */}
        <div className="mb-5">
          <label className={labelCls}>Business Logo</label>
          <div className="flex items-center gap-4">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Logo preview"
                className="w-16 h-16 object-contain border border-[#c5c6d0] rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-[#efedf2] rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-[#c5c6d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-semibold text-[#1b2e5e] border border-[#1b2e5e] rounded-lg hover:bg-[#eef0f8] transition-colors"
              >
                {formData.logoUrl ? "Change Logo" : "Upload Logo"}
              </button>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
                  className="ml-2 px-4 py-2 text-sm font-semibold text-[#ba1a1a] hover:text-[#93000a] transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {errors.logoUrl && <p className="mt-1 text-xs text-[#ba1a1a]">{errors.logoUrl}</p>}
        </div>

        {/* Business Name */}
        <div className="mb-4">
          <label className={labelCls}>Business Name *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? `${inputCls} border-[#ba1a1a]` : inputCls}
            placeholder="Your Business Name"
          />
          {errors.name && <p className="mt-1 text-xs text-[#ba1a1a]">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className={labelCls}>Business Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[#dee2e6] bg-white text-[#1b1b1f] text-sm focus:border-[#1b2e5e] focus:outline-none transition-colors resize-none"
            placeholder="e.g. Importers & exporters of..."
          />
        </div>

        {/* Motto */}
        <div className="mb-4">
          <label className={labelCls}>Business Motto / Tagline</label>
          <input
            name="motto"
            value={formData.motto}
            onChange={handleChange}
            className={inputCls}
            placeholder="e.g. In God We Trust"
          />
        </div>

        {/* Address Line 1 */}
        <div className="mb-4">
          <label className={labelCls}>Business Address Line 1 *</label>
          <input
            name="addressOne"
            value={formData.addressOne}
            onChange={handleChange}
            className={errors.addressOne ? `${inputCls} border-[#ba1a1a]` : inputCls}
            placeholder="123 Business Street"
          />
          {errors.addressOne && <p className="mt-1 text-xs text-[#ba1a1a]">{errors.addressOne}</p>}
        </div>

        {/* Address Line 2 */}
        <div className="mb-4">
          <label className={labelCls}>Address Line 2 (optional)</label>
          <input
            name="addressTwo"
            value={formData.addressTwo}
            onChange={handleChange}
            className={inputCls}
            placeholder="City, State/Province, Postal Code"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Phone Number *</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? `${inputCls} border-[#ba1a1a]` : inputCls}
              placeholder="+1 234 567 8900"
            />
            {errors.phone && <p className="mt-1 text-xs text-[#ba1a1a]">{errors.phone}</p>}
          </div>
          <div>
            <label className={labelCls}>Email Address *</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? `${inputCls} border-[#ba1a1a]` : inputCls}
              placeholder="contact@business.com"
            />
            {errors.email && <p className="mt-1 text-xs text-[#ba1a1a]">{errors.email}</p>}
          </div>
        </div>

        {/* Registration Number */}
        <div className="mb-4">
          <label className={labelCls}>Business Registration Number (optional)</label>
          <input
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleChange}
            className={inputCls}
            placeholder="RC-123456"
          />
        </div>

        {/* Signature */}
        <div className="mb-2">
          <label className={labelCls}>Authorized Signature</label>
          <div className="flex gap-5 mb-3 text-sm">
            {["none", "text", "image"].map((type) => (
              <label key={type} className="flex items-center gap-1.5 capitalize cursor-pointer text-[#45464f]">
                <input
                  type="radio"
                  checked={formData.signatureType === type}
                  onChange={() =>
                    setFormData((p) => ({
                      ...p,
                      signatureType: type as any,
                      signatureUrl: type !== "image" ? "" : p.signatureUrl,
                      signatureText: type !== "text" ? "" : p.signatureText,
                    }))
                  }
                  className="accent-[#1b2e5e]"
                />
                {type === "image" ? "Draw" : type}
              </label>
            ))}
          </div>

          {formData.signatureType === "text" && (
            <input
              name="signatureText"
              value={formData.signatureText}
              onChange={handleChange}
              className={inputCls}
              placeholder="Chike Ade, CEO"
            />
          )}

          {formData.signatureType === "image" && (
            <div className="space-y-3">
              {!formData.signatureUrl ? (
                <SignaturePad onDrawEnd={handleSignatureCapture} />
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="relative w-full h-28 border border-[#c5c6d0] rounded-lg bg-[#f5f3f8] flex items-center justify-center p-4">
                    <img src={formData.signatureUrl} alt="Signature preview" className="max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="absolute top-2 right-2 p-1.5 bg-[#ffdad6] text-[#ba1a1a] rounded-full hover:bg-[#ba1a1a] hover:text-white transition-colors"
                      title="Remove signature"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">✓ Signature saved to cloud</p>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-[#757680]">This name will appear on receipts as the authorized signatory.</p>
      </div>

      {/* Currency & Tax Card */}
      <div className="bg-white rounded-xl p-5 shadow-[0px_2px_4px_rgba(27,46,94,0.05)] border border-[#c5c6d0]">
        <h2 className="text-sm font-semibold text-[#1b1b1f] mb-5">Currency &amp; Tax Settings</h2>

        <div className="mb-4">
          <label className={labelCls}>Currency</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className={inputCls}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.symbol}>
                {c.symbol} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            name="taxEnabled"
            type="checkbox"
            checked={formData.taxEnabled}
            onChange={handleChange}
            className="w-4 h-4 rounded accent-[#1b2e5e]"
          />
          <span className="text-sm text-[#45464f]">Enable tax by default on new receipts</span>
        </label>

        {formData.taxEnabled && (
          <div>
            <label className={labelCls}>Default Tax Rate (%)</label>
            <input
              name="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.taxRate}
              onChange={handleChange}
              className={inputCls}
              placeholder="10"
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full h-13 rounded-lg bg-[#1b2e5e] hover:bg-[#011848] text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)]"
      >
        {saving ? "Saving..." : "Continue to Template Selection →"}
      </button>
    </form>
  );
}
