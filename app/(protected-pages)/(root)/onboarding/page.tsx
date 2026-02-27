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
    currency: "USD",
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
        // Prioritize existing business data, then user data, then defaults
        name: business?.name || "",
        email: business?.email || user?.email || "",
        phone: business?.phone || "",
        addressOne: business?.addressOne || "",
        addressTwo: business?.addressTwo || "",
        description: business?.description ?? "",
        motto: business?.motto ?? "",
        registrationNumber: business?.registrationNumber ?? "",
         // Branding
        logoUrl: business?.logoUrl ?? "",
        signatureUrl: business?.signatureUrl ?? "",
        signatureType: business?.signatureType ?? "none",
        signatureText: business?.signatureText ?? "",

        // Financial
        currency: business?.currency ?? "USD",
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
      [name]: type === "checkbox" ? checked : type === "number"? parseFloat(value) || 0 : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

 const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((p) => ({ ...p, logoUrl: "Logo must be under 2MB" }));
      return;
    }

    try {
      setSaving(true); // Disable the submit button while uploading
      const url = await uploadToCloudinary(file, "business-logos");
      setFormData(p => ({ ...p, logoUrl: url }));
    } catch (err) {
      setErrors(p => ({ ...p, general: "Failed to upload logo. Please try again." }));
    } finally {
      setSaving(false);
    }
  };

 const handleSignatureCapture = async (blob: Blob) => {
    try {
      setSaving(true);
      // Clear any previous general errors before trying
      setErrors((prev) => ({ ...prev, general: "" }));

      const url = await uploadToCloudinary(blob, "business-signatures");
      
      setFormData(p => ({ 
        ...p, 
        signatureUrl: url,
        signatureType: "image" // Ensure type is set to image upon successful capture
      }));
    } catch (err) {
      console.error("Signature upload failed:", err);
      setErrors((prev) => ({ 
        ...prev, 
        general: "Failed to upload signature. Please try drawing it again." 
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
    const validationErrors = validateBusinessForm(formData)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General error message */}
      {errors.general && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
          Business Information
        </h2>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Business Logo (optional)
          </label>
          <div className="flex items-center gap-4">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Logo preview"
                className="w-16 h-16 object-contain border rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
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
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {formData.logoUrl ? "Change Logo" : "Upload Logo"}
              </button>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
                  className="ml-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {errors.logoUrl && (
            <p className="mt-1 text-sm text-red-500">{errors.logoUrl}</p>
          )}
        </div>

        {/* Business Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Business Name *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full h-12 px-4 rounded-lg border ${
              errors.name
                ? "border-red-500"
                : "border-slate-300 dark:border-slate-600"
            } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none`}
            placeholder="Your Business Name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Business Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Business Description (optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g importers & exporters of ......"
          />
        </div>

        {/* Business Motto */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Business Motto/Tagline (optional)
          </label>
          <input
            name="motto"
            value={formData.motto}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="eg. In God We Trust"
          />
        </div>

        {/* Address Line 1 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Business Address Line 1 *
          </label>
          <input
            name="addressOne"
            value={formData.addressOne}
            onChange={handleChange}
            className={`w-full h-12 px-4 rounded-lg border ${
              errors.addressOne
                ? "border-red-500"
                : "border-slate-300 dark:border-slate-600"
            } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none`}
            placeholder="123 Business Street"
          />
          {errors.addressOne && (
            <p className="mt-1 text-sm text-red-500">{errors.addressOne}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Business Address Line 2 (optional)
          </label>
          <input
            name="addressTwo"
            value={formData.addressTwo}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="City, State/Province, Postal Code"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.phone
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none`}
              placeholder="+1 234 567 8900"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.email
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none`}
              placeholder="contact@business.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Registration Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Business Registration Number (optional)
          </label>
          <input
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="RC-123456"
          />
        </div>

        {/* Signature */}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Authorized Signature Name (optional)
          </label>

          <div className="flex gap-4 mb-3 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={formData.signatureType === "none"}
                onChange={() =>
                  setFormData((p) => ({ ...p, signatureType: "none",signatureUrl: "", signatureText: "" }))
                }
              />
              None
            </label>

            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={formData.signatureType === "text"}
                onChange={() =>
                  setFormData((p) => ({ ...p, signatureType: "text" }))
                }
              />
              Text
            </label>

            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={formData.signatureType === "image"}
                onChange={() =>
                  setFormData((p) => ({ ...p, signatureType: "image" }))
                }
              />
              Draw
            </label>
          </div>

          {formData.signatureType === "text" && (
            <input
              name="signatureText"
              value={formData.signatureText}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-lg border"
              placeholder="Chike Ade, CEO"
            />
          )}

          {formData.signatureType === "image" && (
            <div className="space-y-3">
              {/* Only show the Pad if we don't have a URL yet */}
              {!formData.signatureUrl ? (
                <SignaturePad
                  onDrawEnd={handleSignatureCapture}
                />
              ) : (
                /* Preview and Delete section */
                <div className="flex flex-col gap-2">
                  <div className="relative w-full h-32 border rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center p-4">
                    <img 
                      src={formData.signatureUrl} 
                      alt="Signature preview" 
                      className="max-h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                      title="Remove signature"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-green-600 font-medium px-1">
                    ✓ Signature saved to cloud
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            This name will appear on receipts as the authorized signatory
          </p>

      </div>

       {/* Tax & Currency Settings  */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
          Currency & Tax Settings
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
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
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Enable tax by default on new receipts
          </span>
        </label>

        {formData.taxEnabled && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Default Tax Rate (%)
            </label>
            <input
              name="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.taxRate}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              placeholder="10"
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full h-14 rounded-xl bg-primary text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving..." : "Continue to Template Selection"}
      </button>
      
    </form>
  );
}