import { Business } from "./types";

export interface FormErrors {
  [key: string]: string;
}

export function validateBusinessForm(data: Partial<Business>): FormErrors {
  const errors: FormErrors = {};

  if (data.name && data.name.trim().length === 0) {
    errors.name = 'Business name is required';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (data.phone && !/^\+?[\d\s-()]+$/.test(data.phone)) {
    errors.phone = 'Invalid phone format';
  }

  return errors;
}