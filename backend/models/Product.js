const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, trim: true, index: true },
    productName: { type: String, required: true, trim: true, maxlength: 100 },
    manufacturerName: { type: String, required: true, trim: true, maxlength: 100 },
    batchNumber: { type: String, required: true, trim: true, maxlength: 50 },
    manufacturingDate: { type: String, required: true, trim: true }, // stored as YYYY-MM-DD text so hashing never changes
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    dataHash: { type: String, required: true }, // keccak256 fingerprint registered on-chain
    txHash: { type: String, required: true },
    walletAddress: { type: String, required: true }, // account that registered it on-chain
    blockchainTimestamp: { type: Number, required: true }, // unix seconds from the contract
  },
  { timestamps: true, bufferCommands: false }
);

module.exports = mongoose.model("Product", productSchema);
