// Validation rules - keep in sync with frontend/src/services/validation.js
const PRODUCT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value) {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function validateProductInput(body) {
  const src = body || {};
  const values = {
    productId: String(src.productId ?? "").trim(),
    productName: String(src.productName ?? "").trim(),
    manufacturerName: String(src.manufacturerName ?? "").trim(),
    batchNumber: String(src.batchNumber ?? "").trim(),
    manufacturingDate: String(src.manufacturingDate ?? "").trim(),
    description: String(src.description ?? "").trim(),
  };
  const errors = {};

  if (!values.productId) errors.productId = "Product ID is required.";
  else if (!PRODUCT_ID_REGEX.test(values.productId))
    errors.productId = "Use 1-64 letters, numbers, dots, dashes or underscores (no spaces).";

  if (!values.productName) errors.productName = "Product name is required.";
  else if (values.productName.length > 100) errors.productName = "Product name must be 100 characters or fewer.";

  if (!values.manufacturerName) errors.manufacturerName = "Manufacturer name is required.";
  else if (values.manufacturerName.length > 100)
    errors.manufacturerName = "Manufacturer name must be 100 characters or fewer.";

  if (!values.batchNumber) errors.batchNumber = "Batch number is required.";
  else if (values.batchNumber.length > 50) errors.batchNumber = "Batch number must be 50 characters or fewer.";

  if (!values.manufacturingDate) errors.manufacturingDate = "Manufacturing date is required.";
  else if (!isRealDate(values.manufacturingDate)) errors.manufacturingDate = "Enter a valid date (YYYY-MM-DD).";
  else {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (values.manufacturingDate > tomorrow) errors.manufacturingDate = "Manufacturing date cannot be in the future.";
  }

  if (!values.description) errors.description = "Product description is required.";
  else if (values.description.length > 1000) errors.description = "Description must be 1000 characters or fewer.";

  return { errors, values };
}

module.exports = { PRODUCT_ID_REGEX, TX_HASH_REGEX, validateProductInput };
