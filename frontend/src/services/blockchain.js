import { BrowserProvider, Contract } from "ethers";
import deployment from "../contracts/ProductRegistry.json";

export const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || deployment.chainId || 31337);
export const CONTRACT_ADDRESS = deployment.address || "";

export const HARDHAT_NETWORK = {
  chainId: "0x" + EXPECTED_CHAIN_ID.toString(16),
  chainName: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["http://127.0.0.1:8545"],
};

export const isMetaMaskInstalled = () => typeof window !== "undefined" && Boolean(window.ethereum);

function getProvider() {
  if (!isMetaMaskInstalled()) throw new Error("MetaMask is not installed in this browser.");
  return new BrowserProvider(window.ethereum);
}

export async function requestAccounts() {
  if (!isMetaMaskInstalled()) throw new Error("MetaMask is not installed in this browser.");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0] || null;
}

export async function getExistingAccount() {
  if (!isMetaMaskInstalled()) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0] || null;
}

export async function getChainId() {
  const network = await getProvider().getNetwork();
  return Number(network.chainId);
}

export async function switchToHardhat() {
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HARDHAT_NETWORK.chainId }] });
  } catch (err) {
    // 4902 = the network is not added to MetaMask yet
    const code = err && (err.code ?? err?.data?.originalError?.code);
    if (code === 4902 || code === -32603) {
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [HARDHAT_NETWORK] });
    } else {
      throw err;
    }
  }
}

/** Throws a helpful error unless the contract really exists on the connected chain. */
export async function assertContractDeployed() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("The smart contract is not deployed yet. Run: npm run deploy (project root), then refresh this page.");
  }
  const code = await getProvider().getCode(CONTRACT_ADDRESS);
  if (code === "0x") {
    throw new Error(
      "No contract found at the configured address. The local blockchain was probably restarted - run: npm run deploy, then refresh this page."
    );
  }
}

async function readContract() {
  return new Contract(CONTRACT_ADDRESS, deployment.abi, getProvider());
}

export async function isAuthorizedManufacturer(account) {
  const contract = await readContract();
  return contract.isAuthorizedManufacturer(account);
}

export async function isRegisteredOnChain(productId) {
  const contract = await readContract();
  return contract.isProductRegistered(productId);
}

/**
 * Sends the registration transaction, waits for MetaMask approval, then waits for the
 * transaction to be mined. Only returns after confirmation.
 * onSubmitted(txHash) is called once the user approved and the tx was sent.
 */
export async function registerProductOnChain(productId, dataHash, onSubmitted) {
  const signer = await getProvider().getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, deployment.abi, signer);
  const tx = await contract.registerProduct(productId, dataHash);
  if (onSubmitted) onSubmitted(tx.hash);
  const receipt = await tx.wait(1);
  if (!receipt || receipt.status !== 1) throw new Error("The transaction was mined but failed on the blockchain.");
  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
}

/** Turns ethers / MetaMask errors into short messages a beginner can act on. */
export function friendlyError(err) {
  if (!err) return "Unknown error.";
  if (err.code === "ACTION_REJECTED" || err.code === 4001) return "You rejected the request in MetaMask.";
  const text = String(err.reason || err.shortMessage || err?.info?.error?.message || err.message || err);
  if (/nonce too high|nonce.*too/i.test(text))
    return "MetaMask's transaction counter is out of sync with the restarted blockchain. In MetaMask: Settings > Advanced > Clear activity tab data, then try again.";
  if (/user rejected|denied/i.test(text)) return "You rejected the request in MetaMask.";
  if (/Product ID already registered/i.test(text)) return "This Product ID is already registered on the blockchain.";
  if (/not an authorized manufacturer/i.test(text)) return "This MetaMask account is not an authorized manufacturer.";
  if (/could not detect network|failed to fetch|ECONNREFUSED|network error/i.test(text))
    return "Cannot reach the blockchain. Is `npm run node` still running?";
  return text.length > 400 ? text.slice(0, 400) + "..." : text;
}
