const mongoose = require("mongoose");
const ScanLog = require("../models/ScanLog");

// GET /api/scans?productId=ABC&limit=50
exports.listScans = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1)
      return res.status(503).json({ message: "The database is not available. Make sure MongoDB is running." });

    const filter = {};
    const productId = String(req.query.productId || "").trim();
    if (productId) filter.productId = productId;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const scans = await ScanLog.find(filter).sort({ scannedAt: -1 }).limit(limit).lean();
    return res.json({
      scans: scans.map((s) => ({
        id: String(s._id),
        productId: s.productId,
        result: s.result,
        message: s.message,
        source: s.source,
        suspicious: s.suspicious,
        scannedAt: s.scannedAt,
      })),
    });
  } catch (err) {
    console.error("listScans error:", err);
    return res.status(500).json({ message: "Unexpected server error while reading scan history." });
  }
};
