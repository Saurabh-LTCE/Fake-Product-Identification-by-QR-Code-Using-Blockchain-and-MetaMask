// Product hashing - MUST stay identical to backend/utils/productHash.js
import { keccak256, toUtf8Bytes } from "ethers";

export const HASH_FIELDS = [
  "productId",
  "productName",
  "manufacturerName",
  "batchNumber",
  "manufacturingDate",
  "description",
];

export function normalizeProduct(product) {
  return HASH_FIELDS.map((field) => String(product[field] ?? "").trim());
}

/** keccak256 over the JSON array of trimmed field values, in a fixed order. */
export function computeProductHash(product) {
  return keccak256(toUtf8Bytes(JSON.stringify(normalizeProduct(product))));
}
