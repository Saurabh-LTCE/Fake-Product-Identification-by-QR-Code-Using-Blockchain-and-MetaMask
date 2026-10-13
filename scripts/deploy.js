// Deploys ProductRegistry to the running local Hardhat node and writes the
// address + ABI to the backend and frontend so they always stay in sync.
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const OUTPUT_FILES = [
  path.join(__dirname, "..", "backend", "contracts", "ProductRegistry.json"),
  path.join(__dirname, "..", "frontend", "src", "contracts", "ProductRegistry.json"),
];

async function main() {
  const { ethers, artifacts, network } = hre;

  if (network.name === "hardhat") {
    throw new Error(
      "You deployed to the temporary in-process network, which disappears immediately.\n" +
        "Run:  npm run deploy   (it uses --network localhost and needs `npm run node` running)."
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Network:   ${network.name}`);
  console.log(`Deployer:  ${deployer.address}  (this account becomes the authorized manufacturer)`);

  const Factory = await ethers.getContractFactory("ProductRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();

  const artifact = await artifacts.readArtifact("ProductRegistry");
  const chain = await ethers.provider.getNetwork();

  const output = {
    contractName: "ProductRegistry",
    address,
    chainId: Number(chain.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  for (const file of OUTPUT_FILES) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(output, null, 2) + "\n");
    console.log(`Wrote:     ${path.relative(path.join(__dirname, ".."), file)}`);
  }

  console.log("");
  console.log(`ProductRegistry deployed at ${address}`);
  console.log("If the backend or frontend is already running, refresh the browser page.");
  console.log("(The backend re-reads the contract file automatically; Vite reloads the frontend.)");
}

main().catch((error) => {
  console.error("\nDeployment FAILED:");
  console.error(error.message || error);
  if (String(error.message || "").includes("ECONNREFUSED") || String(error.message || "").includes("connect")) {
    console.error("\nIs the local blockchain running? Start it in another terminal with:  npm run node");
  }
  process.exit(1);
});
