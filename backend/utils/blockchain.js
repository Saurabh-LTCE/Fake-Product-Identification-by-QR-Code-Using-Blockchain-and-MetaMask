// Read-only access to the ProductRegistry contract on the local Hardhat blockchain.
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

class ChainError extends Error {}

const DEPLOYMENT_FILE = path.join(__dirname, "..", "contracts", "ProductRegistry.json");
const providers = new Map();

function rpcUrl() {
  return process.env.RPC_URL || "http://127.0.0.1:8545";
}

// Read fresh on every call so a re-deploy is picked up without restarting the backend.
function loadDeployment() {
  let raw;
  try {
    raw = fs.readFileSync(DEPLOYMENT_FILE, "utf8");
  } catch {
    throw new ChainError("backend/contracts/ProductRegistry.json is missing. Deploy the contract with: npm run deploy");
  }
  let deployment;
  try {
    deployment = JSON.parse(raw);
  } catch {
    throw new ChainError("backend/contracts/ProductRegistry.json is not valid JSON. Redeploy with: npm run deploy");
  }
  if (!deployment.address || !ethers.isAddress(deployment.address)) {
    throw new ChainError("The smart contract has not been deployed yet. Run: npm run deploy (from the project root).");
  }
  return deployment;
}

function getProvider(chainId) {
  const url = rpcUrl();
  const key = `${url}|${chainId}`;
  if (!providers.has(key)) {
    const network = ethers.Network.from(chainId);
    providers.set(key, new ethers.JsonRpcProvider(url, network, { staticNetwork: network }));
  }
  return providers.get(key);
}

async function getContract() {
  const deployment = loadDeployment();
  const provider = getProvider(Number(deployment.chainId || 31337));
  let code;
  try {
    code = await provider.getCode(deployment.address);
  } catch {
    throw new ChainError(`Cannot connect to the blockchain node at ${rpcUrl()}. Start it with: npm run node`);
  }
  if (code === "0x") {
    throw new ChainError(
      "No contract exists at the configured address. The local blockchain was probably restarted - redeploy with: npm run deploy"
    );
  }
  return new ethers.Contract(deployment.address, deployment.abi, provider);
}

/** Returns { registered, dataHash, registeredAt (unix seconds), registeredBy }. */
async function getOnChainProduct(productId) {
  const contract = await getContract();
  try {
    const [registered, dataHash, registeredAt, registeredBy] = await contract.getProduct(productId);
    return { registered, dataHash, registeredAt: Number(registeredAt), registeredBy };
  } catch (err) {
    throw new ChainError(`Blockchain read failed: ${err.shortMessage || err.message}`);
  }
}

async function getChainStatus() {
  try {
    const deployment = loadDeployment();
    const provider = getProvider(Number(deployment.chainId || 31337));
    const blockNumber = await provider.getBlockNumber();
    const code = await provider.getCode(deployment.address);
    return {
      connected: true,
      rpcUrl: rpcUrl(),
      contractAddress: deployment.address,
      contractDeployed: code !== "0x",
      blockNumber,
    };
  } catch (err) {
    return { connected: false, rpcUrl: rpcUrl(), error: err.message };
  }
}

module.exports = { ChainError, getOnChainProduct, getChainStatus };
