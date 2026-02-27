
import { Business } from "./types";


export interface FormErrors {
  [key: string]: string;
}

export  function validateBusinessForm(
  data: Partial<Business>
): FormErrors {
  const errors: FormErrors = {};

  // Name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Business name is required";
  }

  // Description

  // Address
  if (!data.addressOne || data.addressOne.trim().length === 0) {
    errors.addressOne = "Primary address is required";
  }


  // Motto
  if (data.motto && data.motto.trim().length === 0) {
    errors.motto = "Motto cannot be empty";
  }

  // Phone
  if (data.phone && !/^\+?[\d\s\-()]{7,}$/.test(data.phone)) {
    errors.phone = "Invalid phone format";
  }

  // Email
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Invalid email format";
  }

  // Registration Number
 

  // Logo URL
  if (data.logoUrl && !/^https?:\/\/.+/.test(data.logoUrl)) {
    errors.logoUrl = "Logo URL must be a valid URL";
  }

  // Currency
  if (!data.currency || data.currency.trim().length !== 3) {
    errors.currency = "Currency must be a valid 3-letter code";
  }

  // Tax
  if (data.taxEnabled) {
    if (data.taxRate === undefined || data.taxRate < 0) {
      errors.taxRate = "Tax rate must be a positive number";
    }
  }

  // Signature
  if (data.signatureType === "text") {
    if (!data.signatureText || data.signatureText.trim().length === 0) {
      errors.signatureText = "Signature text is required";
    }
  }

  if (data.signatureType === "image") {
    if (!data.signatureUrl || !/^https?:\/\/.+/.test(data.signatureUrl)) {
      errors.signatureUrl = "Valid signature image URL is required";
    }
  }

  return errors;
}
