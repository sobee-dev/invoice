// lib/invoiceFile.ts
import axios from "axios";
import api from "@/lib/axios";

async function messageFrom(err: unknown): Promise<string> {
  if (!axios.isAxiosError(err)) return "Could not create the file. Please try again.";

  const status = err.response?.status;
  if (status === 429) {
    const wait = parseInt(String(err.response?.headers?.["retry-after"] ?? ""), 10);
    return Number.isFinite(wait)
      ? `You are creating files too quickly. Try again in ${wait} seconds.`
      : "You are creating files too quickly. Please wait a moment.";
  }
  if (status === 401) return "Your session has ended. Please sign in again.";

  // With responseType "blob", the JSON error arrives as a Blob, so read it.
  const data = err.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (typeof parsed?.error === "string") return parsed.error;
    } catch {
      /* not JSON */
    }
  }
  return "Could not create the file. Please try again.";
}

export async function fetchInvoiceFile(html: string, type: "pdf" | "image", baseName: string): Promise<File> {
  const name = `${baseName}.${type === "pdf" ? "pdf" : "png"}`;
  try {
    const { data } = await api.post<Blob>(
      "/api/invoice-file",
      { html, type, fileName: name },
      { baseURL: "", responseType: "blob", timeout: 70_000 },
    );
    return new File([data], name, { type: data.type });
  } catch (err) {
    throw new Error(await messageFrom(err));
  }
}