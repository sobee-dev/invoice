// lib/cloudinaryUpload.ts
//
// Web twin of lib/imageUpload.ts on mobile, verified against it. Flow:
//   1. POST /api/business/cloudinary/signature/ { folder, resourceId }
//      -> { signature, timestamp, apiKey, cloudName, publicId, overwrite }
//      (camelCased by Django's renderer; the server picks public_id and signs it)
//   2. POST the file straight to Cloudinary with Cloudinary's own snake_case
//      fields. A real Blob goes in FormData, never a { uri, name, type } object.

import api from "@/lib/axios";

export type UploadFolder = "business-logos" | "business-signatures" | "product-images";

interface CloudinarySignaturePayload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  publicId: string;
  overwrite: boolean;
}

export async function uploadImage(
  file: Blob,
  folder: UploadFolder,
  filename: string,
  resourceId?: string, // business-scoped folders have one slot per business, so omit
): Promise<string> {
  const { data: sig } = await api.post<CloudinarySignaturePayload>("/api/business/cloudinary/signature/", {
    folder,
    resourceId,
  });

  const form = new FormData();
  form.append("file", file, filename);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("public_id", sig.publicId);
  form.append("overwrite", String(sig.overwrite));

  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form });
  } catch (err) {
    throw new Error(`Could not reach Cloudinary: ${err instanceof Error ? err.message : String(err)}`);
  }

  const json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!json.secure_url) throw new Error(json.error?.message || "Cloudinary upload failed");
  return json.secure_url;
}

/** Same endpoint mobile uses for explicit removal. */
export async function deleteCloudinaryAsset(folder: UploadFolder, resourceId?: string): Promise<void> {
  await api.post("/api/business/cloudinary/remove/", { folder, resourceId });
}