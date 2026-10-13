require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const Product = require("./models/Product");
const ScanLog = require("./models/ScanLog");
const productRoutes = require("./routes/productRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const scanRoutes = require("./routes/scanRoutes");
const { getChainStatus } = require("./utils/blockchain");

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fake_product_db";
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", async (req, res) => {
  const database = mongoose.connection.readyState === 1;
  const blockchain = await getChainStatus();
  const ok = database && blockchain.connected && blockchain.contractDeployed;
  res.json({ status: ok ? "ok" : "degraded", database, blockchain });
});

app.use("/api/products", productRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/scans", scanRoutes);

app.use("/api", (req, res) => res.status(404).json({ message: `No such API route: ${req.method} ${req.originalUrl}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") return res.status(400).json({ message: "Request body is not valid JSON." });
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Unexpected server error." });
});

function maskUri(uri) {
  return uri.replace(/\/\/([^:@/]+):([^@]+)@/, "//$1:****@");
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await Product.init(); // make sure the unique productId index exists
    await ScanLog.init();
    console.log(`MongoDB connected: ${maskUri(MONGODB_URI)}`);
  } catch (err) {
    console.error(`\nCould not connect to MongoDB at ${maskUri(MONGODB_URI)}`);
    console.error(`Reason: ${err.message}`);
    console.error("Fix: start MongoDB (Windows service 'MongoDB Server') or correct MONGODB_URI in backend/.env\n");
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => console.error("MongoDB disconnected - API calls will return 503 until it is back."));
  mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected."));

  const server = app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}  (health: http://localhost:${PORT}/api/health)`);
    getChainStatus().then((s) => {
      if (s.connected && s.contractDeployed) console.log(`Blockchain OK - contract ${s.contractAddress} on ${s.rpcUrl}`);
      else console.warn(`Blockchain NOT ready: ${s.error || "contract not found at the configured address"}`);
    });
  });
  server.on("error", (err) => {
    console.error(err.code === "EADDRINUSE" ? `Port ${PORT} is already in use. Close the other backend or change PORT in backend/.env` : err.message);
    process.exit(1);
  });
}

start();
