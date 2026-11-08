// components/products/ProductForm.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { SectionCard } from "@/components/ui/SectionCard";
import { btnNavy, btnOutline, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { deleteCloudinaryAsset, PRODUCT_IMAGE_FOLDER, uploadToCloudinary, validateImageFile } from "@/lib/imageUpload";
import type { ProductData } from "@/lib/products";
import { ROUTES, staffProductRoute } from "@/lib/routes";
import { productService } from "@/services/products";
import { resolveCurrency } from "@/utils/currencySymbol";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

const WHOLE_NUMBER = /^\d+$/;

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

export function ProductForm({ product, variant = "owner" }: { product?: ProductData; variant?: "owner" | "staff" }) {
  const router = useRouter();
  const { business } = useBusiness();
  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";
  const isEdit = Boolean(product);
  const originalImage = product?.imageUrl ?? "";

  // Staff land on their own read only pages, owners on the owner pages.
  const listHref = variant === "staff" ? ROUTES.staffProducts : "/products";
  const detailHref = (id: string) => (variant === "staff" ? staffProductRoute(id) : `/products/${id}`);

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.unitPrice) : "");
  const [qty, setQty] = useState(product ? String(product.quantityOnHand) : "0");
  const [reorder, setReorder] = useState(product?.reorderLevel != null ? String(Number(product.reorderLevel)) : "3");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [partialId, setPartialId] = useState<string | null>(null);

  // Image state. imageUrl is the saved or freshly uploaded address, stagedFile is a
  // picture waiting for a new product to exist, previewUrl is the local copy shown meanwhile.
  const [imageUrl, setImageUrl] = useState(originalImage);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageChanged, setImageChanged] = useState(false);

  // Frees the local preview whenever it is replaced, and when the form closes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const qtyIsValid = WHOLE_NUMBER.test(qty.trim());
  const qtyDelta = product && qtyIsValid ? Number.parseInt(qty, 10) - product.quantityOnHand : 0;
  const qtyChanged = isEdit && qtyDelta !== 0;

  const handleSelectImage = async (file: File) => {
    const problem = validateImageFile(file);
    if (problem) {
      setImageError(problem);
      return;
    }
    setImageError("");
    setPreviewUrl(URL.createObjectURL(file));

    // A new product has no id to upload against yet, so the file waits until it is saved.
    if (!product) {
      setStagedFile(file);
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file, PRODUCT_IMAGE_FOLDER, product.id, "product.jpg");
      setImageUrl(url);
      setImageChanged(true);
      setPreviewUrl("");
    } catch (err: any) {
      setPreviewUrl("");
      setImageError(err?.message || "The image could not be uploaded. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageError("");
    setStagedFile(null);
    setPreviewUrl("");
    if (product) {
      // Takes effect when the product is saved.
      setImageUrl("");
      setImageChanged(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploadingImage) return;

    const priceNumber = Number.parseFloat(price);
    if (!name.trim()) return setError("Enter a product name.");
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) return setError("Enter a unit price greater than zero.");
    if (!qtyIsValid) return setError("Enter the quantity as a whole number, zero or more.");
    if (!WHOLE_NUMBER.test(reorder.trim())) return setError("Enter the reorder level as a whole number, zero or more.");
    if (qtyChanged && !reason.trim()) return setError("Add a reason for the stock change.");

    const qtyNumber = Number.parseInt(qty, 10);
    const reorderNumber = Number.parseInt(reorder, 10);

    setSaving(true);
    setError("");

    try {
      if (!product) {
        const created = await productService.create({
          name: name.trim(),
          sku: sku.trim() || undefined,
          description: description.trim(),
          unitPrice: priceNumber,
          quantityOnHand: qtyNumber,
          reorderLevel: reorderNumber,
          isActive,
        });

        if (stagedFile) {
          try {
            const url = await uploadToCloudinary(stagedFile, PRODUCT_IMAGE_FOLDER, created.id, "product.jpg");
            await productService.update(created.id, { imageUrl: url });
          } catch {
            setPartialId(created.id);
            setError(
              variant === "staff"
                ? "The product was saved, but its image could not be uploaded. Ask the business owner to add the image."
                : "The product was saved, but its image could not be uploaded. Open the product and add the image from Edit.",
            );
            setSaving(false);
            return;
          }
        }

        router.replace(detailHref(created.id));
        return;
      }

      await productService.update(product.id, {
        name: name.trim(),
        sku: sku.trim() || null,
        description: description.trim(),
        unitPrice: priceNumber,
        reorderLevel: reorderNumber,
        isActive,
        // Only sent when the picture was replaced or removed, so an untouched image is left alone.
        ...(imageChanged ? { imageUrl } : {}),
      });

      // The stored file goes only after the product no longer points at it. A failure here is harmless.
      if (imageChanged && !imageUrl && originalImage) {
        deleteCloudinaryAsset(PRODUCT_IMAGE_FOLDER, product.id).catch(() => {});
      }

      if (qtyChanged) {
        try {
          await productService.adjustStock(product.id, { quantityChange: qtyDelta, reason: reason.trim() });
        } catch {
          setPartialId(product.id);
          setError("The product details were saved, but the quantity change failed. Try it again from the product page.");
          setSaving(false);
          return;
        }
      }

      router.replace(detailHref(product.id));
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not save this product. Please try again."));
      setSaving(false);
    }
  };

  const cancelHref = product ? detailHref(product.id) : listHref;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6" noValidate>
      {error && (
        <div role="alert" className="rounded-lg border border-[#f9b4ae] bg-error-container p-4 text-body-md text-error">
          {error}
          {partialId && (
            <Link href={detailHref(partialId)} className="ml-2 font-semibold underline">
              Open the product
            </Link>
          )}
        </div>
      )}

      <SectionCard title="Product image">
        <ImageUploader
          imageUrl={previewUrl || imageUrl}
          busy={uploadingImage}
          disabled={saving}
          error={imageError}
          onSelect={handleSelectImage}
          onRemove={handleRemoveImage}
        />
      </SectionCard>

      <SectionCard title="Product details">
        <div className="space-y-5">
          <Field label="Product name" htmlFor="p-name">
            <input
              id="p-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              disabled={saving}
              placeholder="For example: Premium hub"
              className={`${inputClasses} h-11`}
            />
          </Field>
          <Field label="SKU" htmlFor="p-sku" hint="Optional. A code you use to recognise the product.">
            <input
              id="p-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              disabled={saving}
              placeholder="PRO-001"
              className={`${inputClasses} h-11`}
            />
          </Field>
          <Field label="Description" htmlFor="p-desc">
            <textarea
              id="p-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              placeholder="Anything that helps you or your staff pick the right product"
              className={`${inputClasses} py-3`}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Pricing and stock">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label={`Unit price${symbol ? ` (${symbol})` : ""}`} htmlFor="p-price">
            <input
              id="p-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => { setPrice(e.target.value.replace(/[^0-9.]/g, "")); setError(""); }}
              disabled={saving}
              placeholder="0.00"
              className={`${inputClasses} h-11`}
            />
          </Field>
          <Field label={isEdit ? "Quantity on hand" : "Starting quantity"} htmlFor="p-qty">
            <input
              id="p-qty"
              inputMode="numeric"
              value={qty}
              onChange={(e) => { setQty(e.target.value.replace(/\D/g, "")); setError(""); }}
              disabled={saving}
              className={`${inputClasses} h-11`}
            />
          </Field>
          <Field label="Reorder level" htmlFor="p-reorder" hint="You are warned when stock drops to this number.">
            <input
              id="p-reorder"
              inputMode="numeric"
              value={reorder}
              onChange={(e) => { setReorder(e.target.value.replace(/\D/g, "")); setError(""); }}
              disabled={saving}
              className={`${inputClasses} h-11`}
            />
          </Field>
        </div>

        {qtyChanged && (
          <div className="mt-5">
            <p className="mb-2 text-body-md text-on-surface-variant">
              {qtyDelta > 0
                ? `Adding ${qtyDelta} unit${qtyDelta === 1 ? "" : "s"}`
                : `Removing ${Math.abs(qtyDelta)} unit${Math.abs(qtyDelta) === 1 ? "" : "s"}`}
              . This is logged in the product's history.
            </p>
            <Field label="Reason for the change" htmlFor="p-reason">
              <textarea
                id="p-reason"
                rows={2}
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(""); }}
                disabled={saving}
                placeholder="For example: stock count correction, or damaged goods"
                className={`${inputClasses} py-3`}
              />
            </Field>
          </div>
        )}
      </SectionCard>

      <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-outline-variant bg-white p-5 shadow-card">
        <span className="flex-1">
          <span className="block font-bold text-on-surface">Active</span>
          <span className="block text-xs text-on-surface-variant">Inactive products are marked as inactive in your list.</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={saving}
          className="h-5 w-5 accent-primary-container"
        />
      </label>

      <div className="flex justify-end gap-3">
        <Link href={cancelHref} className={btnOutline}>
          Cancel
        </Link>
        <button type="submit" disabled={saving || uploadingImage} className={`${btnNavy} min-w-40`}>
          {saving ? "Saving..." : uploadingImage ? "Uploading image..." : isEdit ? "Save changes" : "Save product"}
        </button>
      </div>
    </form>
  );
}