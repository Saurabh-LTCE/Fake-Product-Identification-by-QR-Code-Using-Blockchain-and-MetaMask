// Product hashing - MUST stay identical to frontend/src/services/productHash.js
const { ethers } = require("ethers");

const HASH_FIELDS = [
  "productId",
  "productName",
  "manufacturerName",
  "batchNumber",
  "manufacturingDate",
  "description",
];

function normalizeProduct(product) {
  return HASH_FIELDS.map((field) => String(product[field] ?? "").trim());
}

/** keccak256 over the JSON array of trimmed field values, in a fixed order. */
function computeProductHash(product) {
  const canonical = JSON.stringify(normalizeProduct(product));
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

module.exports = { HASH_FIELDS, normalizeProduct, computeProductHash };
