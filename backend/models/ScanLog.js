const mongoose = require("mongoose");

const scanLogSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true, index: true },
    result: { type: String, required: true, enum: ["VERIFIED", "INVALID", "DATA_MISMATCH", "ERROR"] },
    message: { type: String, default: "" },
    source: { type: String, enum: ["qr", "manual", "link", "unknown"], default: "unknown" },
    suspicious: { type: Boolean, default: false },
    scannedAt: { type: Date, default: Date.now, index: true },
  },
  { bufferCommands: false }
);

module.exports = mongoose.model("ScanLog", scanLogSchema);
