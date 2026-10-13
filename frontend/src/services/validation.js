// Validation rules - keep in sync with backend/utils/validation.js
export const PRODUCT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function isRealDate(value) {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function validateProduct(form) {
  const values = {
    productId: (form.productId || "").trim(),
    productName: (form.productName || "").trim(),
    manufacturerName: (form.manufacturerName || "").trim(),
    batchNumber: (form.batchNumber || "").trim(),
    manufacturingDate: (form.manufacturingDate || "").trim(),
    description: (form.description || "").trim(),
  };
  const errors = {};

  if (!values.productId) errors.productId = "Product ID is required.";
  else if (!PRODUCT_ID_REGEX.test(values.productId))
    errors.productId = "Use 1-64 letters, numbers, dots, dashes or underscores (no spaces).";

  if (!values.productName) errors.productName = "Product name is required.";
  else if (values.productName.length > 100) errors.productName = "Product name must be 100 characters or fewer.";

  if (!values.manufacturerName) errors.manufacturerName = "Manufacturer name is required.";
  else if (values.manufacturerName.length > 100) errors.manufacturerName = "Manufacturer name must be 100 characters or fewer.";

  if (!values.batchNumber) errors.batchNumber = "Batch number is required.";
  else if (values.batchNumber.length > 50) errors.batchNumber = "Batch number must be 50 characters or fewer.";

  if (!values.manufacturingDate) errors.manufacturingDate = "Manufacturing date is required.";
  else if (!isRealDate(values.manufacturingDate)) errors.manufacturingDate = "Enter a valid date.";
  else if (values.manufacturingDate > todayISO()) errors.manufacturingDate = "Manufacturing date cannot be in the future.";

  if (!values.description) errors.description = "Product description is required.";
  else if (values.description.length > 1000) errors.description = "Description must be 1000 characters or fewer.";

  return { errors, values };
}

/** The QR contains a URL like http://host/verify?productId=P1001 - or just a plain product ID. */
export function extractProductId(text) {
  const value = String(text || "").trim();
  try {
    const url = new URL(value);
    const id = url.searchParams.get("productId");
    if (id) return id.trim();
  } catch {
    /* not a URL - fall through */
  }
  return value;
}

export function buildVerifyUrl(productId) {
  const base = (import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, "");
  return `${base}/verify?productId=${encodeURIComponent(productId)}`;
}
