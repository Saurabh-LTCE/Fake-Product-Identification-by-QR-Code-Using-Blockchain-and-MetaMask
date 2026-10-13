const mongoose = require("mongoose");
const Product = require("../models/Product");
const { validateProductInput, TX_HASH_REGEX, PRODUCT_ID_REGEX } = require("../utils/validation");
const { computeProductHash } = require("../utils/productHash");
const { getOnChainProduct } = require("../utils/blockchain");

const dbReady = () => mongoose.connection.readyState === 1;
const dbDown = (res) =>
  res.status(503).json({ message: "The database is not available. Make sure MongoDB is running, then restart the backend." });

function publicProduct(doc) {
  const p = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete p._id;
  delete p.__v;
  return p;
}

// POST /api/products  - save metadata AFTER the blockchain registration was confirmed
exports.createProduct = async (req, res) => {
  try {
    if (!dbReady()) return dbDown(res);

    const { errors, values } = validateProductInput(req.body);
    const txHash = String((req.body && req.body.txHash) || "").trim();
    if (!TX_HASH_REGEX.test(txHash)) errors.txHash = "A valid transaction hash is required.";
    if (Object.keys(errors).length) return res.status(400).json({ message: "Validation failed.", errors });

    const dataHash = computeProductHash(values);

    // Never trust the browser: confirm on-chain that this product + hash really exist.
    let chain;
    try {
      chain = await getOnChainProduct(values.productId);
    } catch (err) {
      return res.status(503).json({ message: `Cannot check the blockchain: ${err.message}` });
    }
    if (!chain.registered)
      return res.status(400).json({ message: "This Product ID is not registered on the blockchain yet." });
    if (chain.dataHash.toLowerCase() !== dataHash.toLowerCase())
      return res.status(400).json({ message: "The product details do not match the hash registered on the blockchain." });

    const product = await Product.create({
      ...values,
      dataHash,
      txHash,
      walletAddress: chain.registeredBy,
      blockchainTimestamp: chain.registeredAt,
    });
    return res.status(201).json({ message: "Product saved.", product: publicProduct(product) });
  } catch (err) {
    if (err && err.code === 11000)
      return res.status(409).json({ message: "A product with this Product ID already exists in the database." });
    console.error("createProduct error:", err);
    return res.status(500).json({ message: "Unexpected server error while saving the product." });
  }
};

// GET /api/products/:productId
exports.getProduct = async (req, res) => {
  try {
    if (!dbReady()) return dbDown(res);
    const productId = String(req.params.productId || "").trim();
    if (!PRODUCT_ID_REGEX.test(productId)) return res.status(400).json({ message: "Invalid Product ID format." });
    const product = await Product.findOne({ productId }).lean();
    if (!product) return res.status(404).json({ message: "Product not found in the database." });
    return res.json({ product: publicProduct(product) });
  } catch (err) {
    console.error("getProduct error:", err);
    return res.status(500).json({ message: "Unexpected server error while reading the product." });
  }
};

// GET /api/products  - latest registrations
exports.listProducts = async (req, res) => {
  try {
    if (!dbReady()) return dbDown(res);
    const products = await Product.find().sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ products: products.map(publicProduct) });
  } catch (err) {
    console.error("listProducts error:", err);
    return res.status(500).json({ message: "Unexpected server error while listing products." });
  }
};
