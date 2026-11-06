// lib/imageUpload.ts
import api from "@/lib/axios";

export const PRODUCT_IMAGE_FOLDER = "product-images";
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1024;

// Arrives camel cased through the Django renderer: apiKey, cloudName, publicId.
interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  publicId: string;
  overwrite: boolean;
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Choose a JPG, PNG or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "That image is larger than 8 MB. Choose a smaller one.";
  return null;
}

async function getUploadSignature(folder: string, resourceId?: string): Promise<CloudinarySignature> {
  const { data } = await api.post<CloudinarySignature>("/api/business/cloudinary/signature/", { folder, resourceId });
  return data;
}

export async function deleteCloudinaryAsset(folder: string, resourceId?: string): Promise<void> {
  await api.post("/api/business/cloudinary/remove/", { folder, resourceId });
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall back to an image element below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("That file could not be read as an image."));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Shrinks the longest side to maxDimension (never enlarges) and saves it as JPEG at 80 percent.
export async function prepareImage(file: Blob, maxDimension = MAX_DIMENSION): Promise<Blob> {
  const source = await decode(file);
  const isElement = source instanceof HTMLImageElement;
  const srcWidth = isElement ? source.naturalWidth : source.width;
  const srcHeight = isElement ? source.naturalHeight : source.height;

  const scale = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(srcWidth * scale));
  canvas.height = Math.max(1, Math.round(srcHeight * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not prepare this image.");

  // JPEG has no transparency, so paint white first or a transparent PNG turns black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (!isElement) source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  if (!blob) throw new Error("Your browser could not prepare this image.");
  return blob;
}

export async function uploadToCloudinary(
  file: Blob,
  folder: string,
  resourceId?: string,
  filename = "upload.jpg",
): Promise<string> {
  const sig = await getUploadSignature(folder, resourceId);
  const prepared = await prepareImage(file);

  // These field names belong to Cloudinary's own upload API, so they stay snake_case.
  const form = new FormData();
  form.append("file", prepared, filename);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("public_id", sig.publicId);
  form.append("overwrite", String(sig.overwrite));

  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form });
  } catch {
    throw new Error("Could not reach the image service. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || "The image could not be uploaded.");
  return data.secure_url as string;
}