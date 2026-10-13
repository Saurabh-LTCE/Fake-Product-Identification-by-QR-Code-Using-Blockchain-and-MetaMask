const mongoose = require("mongoose");
const Product = require("../models/Product");
const ScanLog = require("../models/ScanLog");
const { PRODUCT_ID_REGEX } = require("../utils/validation");
const { computeProductHash } = require("../utils/productHash");
const { getOnChainProduct } = require("../utils/blockchain");

const THRESHOLD = Number(process.env.SUSPICIOUS_SCAN_THRESHOLD || 5);
const WINDOW_MINUTES = Number(process.env.SUSPICIOUS_SCAN_WINDOW_MINUTES || 10);

// GET /api/verify/:productId?source=qr|manual|link
exports.verifyProduct = async (req, res) => {
  const productId = String(req.params.productId || "").trim();
  if (!PRODUCT_ID_REGEX.test(productId)) {
    return res.status(400).json({ message: "Invalid Product ID format." });
  }
  const sourceParam = String(req.query.source || "unknown");
  const source = ["qr", "manual", "link"].includes(sourceParam) ? sourceParam : "unknown";

  let result;
  let message;
  let product = null;
  let chain = null;
  let computedHash = null;

  try {
    if (mongoose.connection.readyState !== 1) throw new Error("The database is not available. Make sure MongoDB is running.");

    // The blockchain is the source of truth. MongoDB only supplies the details to be checked.
    chain = await getOnChainProduct(productId);
    product = await Product.findOne({ productId }).lean();

    if (!chain.registered) {
      result = "INVALID";
      message = product
        ? "This product is NOT registered on the blockchain. A database record alone is not proof of authenticity."
        : "This product is not registered on the blockchain.";
    } else if (!product) {
      result = "DATA_MISMATCH";
      message = "The product is registered on-chain, but no matching product details were found to check against its hash.";
    } else {
      computedHash = computeProductHash(product);
      if (computedHash.toLowerCase() === chain.dataHash.toLowerCase()) {
        result = "VERIFIED";
        message = "The blockchain record exists and the product data matches the registered hash.";
      } else {
        result = "DATA_MISMATCH";
        message = "The product is registered, but the stored details do NOT match the hash on the blockchain. The data may have been changed.";
      }
    }
  } catch (err) {
    result = "ERROR";
    message = `Verification could not be completed: ${err.message}`;
  }

  // Record the scan and look for unusual repetition (a hint only - never proof of counterfeiting).
  let suspicious = false;
  let suspiciousReason = null;
  let scanLogged = true;
  const scannedAt = new Date();
  try {
    if (mongoose.connection.readyState !== 1) throw new Error("database offline");
    const since = new Date(scannedAt.getTime() - WINDOW_MINUTES * 60 * 1000);
    const recent = await ScanLog.countDocuments({ productId, scannedAt: { $gte: since } });
    if (recent + 1 >= THRESHOLD) {
      suspicious = true;
      suspiciousReason = `This product ID was checked ${recent + 1} times in the last ${WINDOW_MINUTES} minutes. This is unusual and worth a closer look, but it does not prove the product is counterfeit.`;
    }
    await ScanLog.create({ productId, result, message, source, suspicious, scannedAt });
  } catch (err) {
    scanLogged = false;
    console.error("Could not record scan:", err.message);
  }

  return res.json({
    productId,
    result,
    message,
    product: product
      ? {
          productId: product.productId,
          productName: product.productName,
          manufacturerName: product.manufacturerName,
          batchNumber: product.batchNumber,
          manufacturingDate: product.manufacturingDate,
          description: product.description,
        }
      : null,
    chain,
    computedHash,
    suspicious,
    suspiciousReason,
    scanLogged,
    scannedAt: scannedAt.toISOString(),
  });
};
