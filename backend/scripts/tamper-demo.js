// DEMO HELPER: simulates someone editing a product record in MongoDB so that
// verification shows "DATA MISMATCH". Usage (from the backend folder):
//   npm run demo:tamper -- P1001            (tamper)
//   npm run demo:tamper -- P1001 --restore  (undo)
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MARK = " [TAMPERED]";

async function main() {
  const productId = process.argv[2];
  const restore = process.argv.includes("--restore");
  if (!productId || productId.startsWith("--")) {
    console.error("Usage: npm run demo:tamper -- <productId> [--restore]");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fake_product_db", {
    serverSelectionTimeoutMS: 5000,
  });
  const product = await Product.findOne({ productId });
  if (!product) {
    console.error(`No product with ID "${productId}" in MongoDB.`);
    process.exit(1);
  }
  if (restore) {
    product.description = product.description.replace(MARK, "");
    console.log("Restored the original description.");
  } else {
    if (!product.description.endsWith(MARK)) product.description += MARK;
    console.log("Description changed in MongoDB only. The blockchain hash was NOT changed.");
  }
  await product.save();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
