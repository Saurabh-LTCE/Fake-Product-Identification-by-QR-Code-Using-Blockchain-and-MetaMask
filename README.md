<<<<<<< HEAD
# Fake Product Identification by QR Code Using Blockchain and MetaMask

A college Blockchain mini project. A manufacturer registers a product through a website and approves the transaction in
**MetaMask**. A **Solidity** smart contract on a local **Hardhat** blockchain stores the product ID, a hash (fingerprint) of
the product data and a timestamp. Full details live in **MongoDB**. A **QR code** is generated; a customer scans it and the
system checks the blockchain.

> Local demo only: no public deployment, no paid services, no real cryptocurrency.

**New to all this? Start with [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md).** This README is the overview and quick reference.

---

## Architecture

```
 Browser (React + Vite, http://localhost:5173)
   |  \
   |   \__ MetaMask + ethers.js ---> Hardhat node (http://127.0.0.1:8545)  <-- ProductRegistry.sol
   |                                       ^
   v                                       | read-only calls (ethers.js)
 Express API (http://localhost:5000/api) --+
   |
   v
 MongoDB (mongodb://127.0.0.1:27017/fake_product_db)
```

**Registration flow**
1. Manufacturer fills in the form (validated in the browser and again on the server).
2. The browser checks the ID is new (MongoDB and blockchain) and computes `keccak256` of the product data.
3. MetaMask asks the manufacturer to approve `registerProduct(productId, dataHash)`.
4. The app **waits for the transaction to be mined**, then sends the details to the backend.
5. The backend re-hashes the data and **checks the blockchain itself** before saving to MongoDB.
6. A QR code containing `http://localhost:5173/verify?productId=...` is shown and can be downloaded as PNG.

**Verification flow** (`GET /api/verify/:productId`)
1. Read the product record from the blockchain (the source of truth).
2. Read the product details from MongoDB and re-compute their hash.
3. Compare, then store the scan in the history.

| Result | Meaning |
|---|---|
| **VERIFIED** | Registered on-chain **and** the stored data hashes to the on-chain hash |
| **INVALID** | Not registered on-chain (a MongoDB record alone is never proof) |
| **DATA MISMATCH** | Registered on-chain, but stored data does not match the hash (or details are missing) |
| **ERROR** | Blockchain or database could not be reached |

**Hashing rule (same code in `backend/utils/productHash.js` and `frontend/src/services/productHash.js`):**
`keccak256( UTF-8( JSON.stringify([productId, productName, manufacturerName, batchNumber, manufacturingDate, description]) ) )`
with every value trimmed. If you change one file you must change the other.

**Suspicious scans:** a product ID checked 5 times within 10 minutes is flagged ("repeated scans - review"). This is only a
hint and never claims a product is counterfeit. Thresholds are in `backend/.env`.

---

## What each technology does in this project

| Technology | Role |
|---|---|
| **Solidity** | The language of `contracts/ProductRegistry.sol`: rules for who may register and how records are stored. |
| **Hardhat** | Development toolkit: compiles the contract, runs a private local blockchain (`npm run node`), runs tests, deploys. |
| **MetaMask** | Browser wallet. Holds the manufacturer's account and asks for approval of each registration transaction. |
| **MongoDB** | Stores the full product details and the scan history (too bulky/changeable for a blockchain). |
| **QR code** | Printed on the product. Encodes a verification link containing the Product ID. |

---

## Project structure

```
fake-product-blockchain/
  contracts/ProductRegistry.sol        smart contract
  test/ProductRegistry.test.js         automated contract tests
  scripts/deploy.js                    deploys the contract and writes address + ABI to backend and frontend
  scripts/*.ps1                        Windows PowerShell helpers (setup, start-all, start-blockchain, ...)
  hardhat.config.js, package.json      Hardhat configuration + root npm scripts
  backend/                             Express API (models, controllers, routes, utils, scripts)
  frontend/                            React + Vite app (pages, components, services, context, contracts)
  README.md, INSTALLATION_GUIDE.md
```

---

## Quick start (after installing the prerequisites from the guide)

Open the project folder in VS Code and use the terminal (**Terminal > New Terminal**, PowerShell). All commands run from the
**project root** unless stated otherwise.

### Option A - one command
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1       # first time only: installs everything
powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1   # starts blockchain, deploys, backend, frontend
```

### Option B - four terminals, step by step
| Terminal | Folder | Command |
|---|---|---|
| (once) | project root | `npm run install:all` and copy `backend\.env.example` to `backend\.env`, `frontend\.env.example` to `frontend\.env` |
| 1 | project root | `npm run node` (leave running) |
| 2 | project root | `npm run deploy` (run once per blockchain start, then it can be closed) |
| 3 | project root | `npm run backend` (leave running) |
| 4 | project root | `npm run frontend` (leave running) |

Open <http://localhost:5173>. MongoDB must be running (the Windows service starts automatically after installation).

### Other commands
```powershell
npm test            # smart contract tests (project root)
npm run compile     # compile the contract
```

### Restarting the blockchain
The local blockchain **forgets everything when it is stopped**. After restarting `npm run node` you must:
1. run `npm run deploy` again (this rewrites the contract address in backend and frontend),
2. refresh the browser,
3. in MetaMask: **Settings > Advanced > Clear activity tab data** (fixes "nonce too high" errors),
4. note that products from the old chain will now show **INVALID** (they exist in MongoDB but not on the new chain) - that is correct behaviour. Register new ones.

---

## Teacher demo checklist

- [ ] MongoDB service running; terminals: blockchain, backend, frontend all running with no errors
- [ ] MetaMask connected to **Hardhat Local** with the imported test account (Account #0)
- [ ] Open the Home page, explain the architecture diagram above
- [ ] Manufacturer Dashboard: show the "Ready - authorized manufacturer" banner
- [ ] Submit an empty / invalid form to show validation messages
- [ ] Register product `P1001`; show the MetaMask confirmation popup; show progress steps and the QR code; download the PNG
- [ ] Try registering `P1001` again: duplicate is rejected
- [ ] Switch MetaMask to Account #1: show "Not authorized" (only the authorized account can register)
- [ ] Verify page: scan the QR (camera) or paste the ID: **VERIFIED**; show the hash comparison
- [ ] Verify an ID that was never registered, e.g. `FAKE-999`: **INVALID**
- [ ] Tamper demo: `cd backend` then `npm run demo:tamper -- P1001`, verify again: **DATA MISMATCH**; restore with `npm run demo:tamper -- P1001 --restore`
- [ ] Stop MongoDB or the blockchain briefly and verify: **ERROR** (start it again afterwards)
- [ ] Scan History page: attempts listed; scan one ID 5 times quickly to show the "repeated scans" flag
- [ ] Run `npm test` and show the passing contract tests
- [ ] Explain: only the hash is on-chain; MongoDB holds the details; a MongoDB record alone never counts as proof

---

## Scanning with a phone (optional)
Phone and PC must be on the same Wi-Fi. Set `VITE_PUBLIC_BASE_URL=http://YOUR-PC-IP:5173` in `frontend/.env` and restart the
frontend, add `http://YOUR-PC-IP:5173` to `FRONTEND_ORIGIN` in `backend/.env`, and set `VITE_API_URL=http://YOUR-PC-IP:5000/api`.
Browsers only allow the camera on `localhost` or HTTPS, so the in-app camera scanner works on the PC; a phone's normal camera
app can scan the QR code and open the link, but the verify page would also need the PC's firewall to allow ports 5173 and 5000.
For a college demo, scanning the QR from the PC screen with the PC webcam (or using manual entry) is simplest.

## Security notes
- Only Hardhat's **public** test accounts are used. Never import a real wallet's seed phrase or private key.
- The registering account is checked on-chain (`onlyAuthorized`), not just in the UI.
- The backend never trusts the browser: it re-hashes the data and confirms the on-chain record before saving.
- The suspicious-scan flag is a hint, not a verdict.

## Verification status of this package
Details below.

### What was and was not tested
Tested in the build environment (no internet, so dependencies could not be installed):
- Syntax of every backend, deploy, config and test JavaScript file (`node --check`); every React file parsed with esbuild.
- All relative imports resolve; every named import from `services/` matches an export; JSON files parse.
- Solidity function names used by the frontend and backend match the contract.

**Not executed** (needs internet / your machine): `npm install`, Solidity compilation, `npm test`, deployment, MongoDB access,
the backend, the Vite build, MetaMask and camera behaviour, and the PowerShell scripts. The first `npx hardhat compile` or
`npm test` downloads the Solidity compiler (needs internet once).
=======
# Fake-Product-Identification-by-QR-Code-Using-Blockchain-and-MetaMask
 The main goal is to demonstrate how blockchain can help identify fake products by verifying product registration records. I want to use MetaMask to interact with the blockchain smart contract and MongoDB to store additional product information.



HOW TO RUN

Start MongoDB, then npm run node, npm run deploy, npm run backend and npm run frontend.

In MetaMask, select account 0xf39F...2266 on Hardhat Local.

Open http://localhost:5173 and check the Ready banner on the Manufacturer page.

Don’t restart npm run node during the demo. If you do, run npm run deploy again.
>>>>>>> fd62087a07ce978b5494b121f676ff5c7b15c705
