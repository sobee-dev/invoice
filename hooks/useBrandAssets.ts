'use client';
import { useRef, useState } from 'react';
import { deleteCloudinaryAsset, uploadImage } from '@/lib/cloudinaryUpload';

export const MAX_LOGO_BYTES = 3 * 1024 * 1024;
export type SignatureType = 'none' | 'text' | 'image';

/** Same rule on every page that saves a signature. Returns an error message or null. */
export function validateSignature(type: SignatureType, text: string, url: string): string | null {
  if (type === 'text' && !text.trim()) return 'Type your signature, or switch the signature to None.';
  if (type === 'image' && !url) return 'Draw a signature, or switch the signature to None.';
  return null;
}

/** Deferred mode only: call after a successful save to delete assets the owner removed. */
export async function deleteRemovedBrandAssets(
  before: { logoUrl: string; signatureUrl: string },
  after: { logoUrl: string; signatureType: SignatureType },
) {
  await Promise.allSettled([
    before.logoUrl && !after.logoUrl ? deleteCloudinaryAsset('business-logos') : null,
    before.signatureUrl && after.signatureType !== 'image' ? deleteCloudinaryAsset('business-signatures') : null,
  ]);
}

interface Options {
  logoUrl: string;
  signatureUrl: string;
  onLogoChange: (url: string) => void;
  onSignatureChange: (url: string) => void;
  /** Called once the signature is gone; the page flips its type to 'none'. */
  onSignatureRemoved: () => void;
  /** 'immediate' deletes from Cloudinary on click. 'deferred' leaves that to deleteRemovedBrandAssets after save. */
  deleteMode: 'immediate' | 'deferred';
}

export function useBrandAssets(opts: Options) {
  const { onLogoChange, onSignatureChange, onSignatureRemoved, deleteMode } = opts;

  // Always read the latest URL when reverting, even from inside an async handler.
  const logoRef = useRef(opts.logoUrl);
  const sigRef = useRef(opts.signatureUrl);
  logoRef.current = opts.logoUrl;
  sigRef.current = opts.signatureUrl;

  const [logoBusy, setLogoBusy] = useState(false);
  const [sigBusy, setSigBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [sigError, setSigError] = useState<string | null>(null);

  async function handleLogoFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setLogoError('Choose a PNG or JPG image.');
    if (file.size > MAX_LOGO_BYTES) return setLogoError('That image is over 3MB. Choose a smaller one.');

    const previous = logoRef.current;
    const local = URL.createObjectURL(file);
    setLogoError(null);
    onLogoChange(local); // instant preview
    setLogoBusy(true);
    try {
      onLogoChange(await uploadImage(file, 'business-logos', 'logo.jpg'));
    } catch {
      onLogoChange(previous);
      setLogoError('Failed to upload logo. Please try again.');
    } finally {
      URL.revokeObjectURL(local);
      setLogoBusy(false);
    }
  }

  async function handleRemoveLogo() {
    setLogoError(null);
    if (deleteMode === 'deferred') return onLogoChange('');
    setLogoBusy(true);
    try {
      await deleteCloudinaryAsset('business-logos');
      onLogoChange('');
    } catch {
      setLogoError('Failed to remove logo. Please try again.');
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleSignatureDrawn(blob: Blob) {
    const previous = sigRef.current;
    const local = URL.createObjectURL(blob);
    setSigError(null);
    onSignatureChange(local); // instant preview
    setSigBusy(true);
    try {
      onSignatureChange(await uploadImage(blob, 'business-signatures', 'signature.png'));
    } catch {
      onSignatureChange(previous);
      setSigError('Failed to upload signature. Please try drawing it again.');
    } finally {
      URL.revokeObjectURL(local);
      setSigBusy(false);
    }
  }

  async function handleRemoveSignature() {
    setSigError(null);
    if (deleteMode === 'deferred') return onSignatureRemoved();
    setSigBusy(true);
    try {
      await deleteCloudinaryAsset('business-signatures');
      onSignatureRemoved();
    } catch {
      setSigError('Failed to remove signature. Please try again.');
    } finally {
      setSigBusy(false);
    }
  }

  return {
    logoBusy, sigBusy, logoError, sigError,
    handleLogoFile, handleRemoveLogo, handleSignatureDrawn, handleRemoveSignature,
  };
}