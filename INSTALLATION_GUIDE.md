# Installation Guide (Windows 10 / 11, complete beginner)

Follow the steps in order. Every command is for **PowerShell**. "Project root" means the `fake-product-blockchain` folder
(the one containing `package.json`, `hardhat.config.js` and `README.md`).

You need an internet connection for installing software and dependencies. After that, the project runs fully offline.

---

## Step 1 - Install Visual Studio Code
1. Download from <https://code.visualstudio.com/download> (choose **Windows**).
2. Run the installer; keep the default options (tick "Add to PATH" if shown).

## Step 2 - Install Node.js (LTS)
1. Download the **LTS** version from <https://nodejs.org/en/download> and run the installer (defaults are fine).
   Node **20 or 22 LTS** is recommended. If you only see a newer version, older LTS builds are at
   <https://nodejs.org/en/about/previous-releases>. (Hardhat prints a warning on very new Node versions; if you see
   odd errors, install Node 22 LTS.)
2. **Close and reopen VS Code**, open a terminal (**Terminal > New Terminal**) and check:
```powershell
node -v
npm -v
```
Both must print version numbers (for example `v22.x.x` and `10.x.x`).

3. PowerShell may block scripts. Allow scripts for your user once:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Answer `Y` if asked. (Alternatively, always start scripts with `powershell -ExecutionPolicy Bypass -File ...` as shown below.)

## Step 3 - Install MongoDB

### Option A (recommended): MongoDB Community Server on your PC
1. Download from <https://www.mongodb.com/try/download/community> (Platform: **Windows**, Package: **msi**).
2. Run the installer, choose **Complete**, and keep **"Install MongoDB as a Service"** ticked (default).
   Also keep **MongoDB Compass** (a free viewer) ticked if you want to look at the data.
3. Verify the service is running: press `Win + R`, type `services.msc`, find **MongoDB Server** - Status should be **Running**.
   Or in PowerShell:
```powershell
Get-Service MongoDB
```
The default address `mongodb://127.0.0.1:27017` is already what the project uses. Nothing else to configure.

### Option B: MongoDB Atlas (cloud, free tier)
1. Create an account at <https://www.mongodb.com/cloud/atlas/register> and create a free cluster.
2. Create a database user and under **Network Access** allow your IP address.
3. Click **Connect > Drivers** and copy the connection string.
4. Later, in `backend\.env`, set `MONGODB_URI=` to that string (with your password and a database name such as `/fake_product_db`).

## Step 4 - Install the MetaMask extension
1. Open <https://metamask.io/download/> (use only the official site) and install the extension for Chrome, Edge or Brave.
2. Create a wallet when asked. **This wallet is only for opening MetaMask - you will not use it for the project.**
   Never share the seed phrase of a real wallet with anyone or any website.

## Step 5 - Get the project and open it
1. Extract the ZIP (right-click > **Extract All**), for example to `C:\Projects\fake-product-blockchain`.
   Avoid very long paths and folders synced by OneDrive.
2. In VS Code: **File > Open Folder...** and choose the extracted `fake-product-blockchain` folder.
3. Open a terminal: **Terminal > New Terminal**. Check it starts in the project root:
```powershell
pwd
dir
```
You should see `package.json`, `hardhat.config.js`, `backend`, `frontend`, `contracts`.

## Step 6 - Install the project dependencies
**Folder: project root.** Either run the setup script:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```
or do it manually:
```powershell
npm run install:all
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```
This takes a few minutes. Warnings are normal; red `npm ERR!` lines are not (see Troubleshooting).

## Step 7 - Run the smart contract tests (optional but recommended)
**Folder: project root.**
```powershell
npm test
```
The first run downloads the Solidity compiler (internet needed). You should see all tests passing.

## Step 8 - Start the local blockchain  (Terminal 1)
**Folder: project root.**
```powershell
npm run node
```
Leave this terminal open. It lists 20 test accounts with their private keys. **Account #0** is:
```
Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
These are **public, well-known test keys** that only work on your local blockchain. Never send real money to them and never
use them anywhere else.

## Step 9 - Deploy the smart contract  (Terminal 2)
Open a **new terminal** (click the `+` in the terminal panel). **Folder: project root.**
```powershell
npm run deploy
```
You should see `ProductRegistry deployed at 0x...`. This also writes the contract **address and ABI** into
`backend\contracts\ProductRegistry.json` and `frontend\src\contracts\ProductRegistry.json` automatically - you do not edit
anything by hand. You can close this terminal afterwards.

> **Every time you stop and restart `npm run node`, the blockchain is empty again. Run `npm run deploy` again and refresh the browser.**

## Step 10 - Start the backend  (Terminal 3)
New terminal. **Folder: project root.**
```powershell
npm run backend
```
Expected output includes `MongoDB connected` and `Backend running at http://localhost:5000`. If MongoDB is not running the
backend stops with an explanation.

## Step 11 - Start the frontend  (Terminal 4)
New terminal. **Folder: project root.**
```powershell
npm run frontend
```
Open <http://localhost:5173> in the same browser where MetaMask is installed.

> Shortcut for steps 8-11: `powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1` opens the blockchain, backend
> and frontend in separate windows, deploys the contract, and stops with an error if any step fails.

## Step 12 - Configure MetaMask for the local blockchain
1. In MetaMask click the network selector (top left) > **Add a custom network** (or **Add network manually**).
2. Enter:
   - Network name: `Hardhat Local`
   - New RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
3. Save and switch to **Hardhat Local**. (The website's **Switch to Hardhat** button can also add it for you.)

## Step 13 - Import the local test account (the authorized manufacturer)
1. MetaMask > account menu > **Add account or hardware wallet > Import account**.
2. Select type **Private Key** and paste the Account #0 private key from Step 8.
3. The account should show about **10000 ETH** (fake test money) on Hardhat Local.
4. Only this account (the one that deployed the contract) may register products. To demonstrate rejection, also import
   Account #1 from the Hardhat terminal.

## Step 14 - Register and verify a product
1. On the website click **Connect Wallet** and approve the connection to the Hardhat account.
2. Open **Manufacturer Dashboard**. The banner must say **Ready**. If not, it tells you what to fix (install MetaMask,
   switch network, use the authorized account, or redeploy).
3. Fill in the form, for example Product ID `P1001`, name `Organic Green Tea`, manufacturer `GreenLeaf Pvt Ltd`, batch
   `B-2026-04`, a date and a description. Click **Register on blockchain**.
4. MetaMask opens: click **Confirm**. Wait for the progress steps to finish.
5. The QR code appears. Click **Download QR (PNG)**.
6. Open **Verify**. Either scan the QR with the camera (**Start camera scan**, allow camera access; you can point it at the
   QR displayed on screen) or type `P1001` and click **Verify**. You should see **VERIFIED**.
7. Try `FAKE-999` (never registered) for **INVALID**, and see **Scan History** for all attempts.

To demonstrate **DATA MISMATCH**, in a new terminal (**folder: `backend`**):
```powershell
cd backend
npm run demo:tamper -- P1001
```
Verify `P1001` again - the stored description no longer matches the blockchain hash. Undo with
`npm run demo:tamper -- P1001 --restore`.

## Where the contract address and ABI are configured
Nowhere by hand: `scripts/deploy.js` writes `backend/contracts/ProductRegistry.json` and
`frontend/src/contracts/ProductRegistry.json` after every deployment. The backend re-reads its file on every request; the
frontend reloads automatically in development (refresh the page if needed).

## Configuration reference
| File | Variable | Default | Must match |
|---|---|---|---|
| `backend\.env` | `PORT` | `5000` | port in `VITE_API_URL` |
| `backend\.env` | `MONGODB_URI` | `mongodb://127.0.0.1:27017/fake_product_db` | your MongoDB |
| `backend\.env` | `RPC_URL` | `http://127.0.0.1:8545` | Hardhat node / `hardhat.config.js` |
| `backend\.env` | `FRONTEND_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | frontend address |
| `frontend\.env` | `VITE_API_URL` | `http://localhost:5000/api` | backend `PORT` |
| `frontend\.env` | `VITE_CHAIN_ID` | `31337` | Hardhat chain ID |
| `frontend\.env` | `VITE_PUBLIC_BASE_URL` | (empty) | address printed in QR codes |

Restart the backend / frontend after editing `.env` files.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `running scripts is disabled on this system` | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, or start scripts with `powershell -ExecutionPolicy Bypass -File ...` |
| `'node' is not recognized` | Install Node.js LTS, then **close and reopen VS Code** |
| `npm ERR! ... ERESOLVE` or network errors | Check internet/proxy; delete the `node_modules` folder and `package-lock.json` in that folder and run `npm install` again |
| Hardhat warns about an unsupported Node version | Usually harmless; if something fails, install Node 22 LTS |
| `HH502`, `Cannot download compiler` | The first compile needs internet to download Solidity; connect and retry `npm test` |
| `ECONNREFUSED 127.0.0.1:8545` or "Cannot connect to the blockchain" | Start `npm run node` and keep it open |
| Backend says it cannot connect to MongoDB | Start the service: `Get-Service MongoDB` then `Start-Service MongoDB` (admin PowerShell); check `MONGODB_URI` |
| `Port 5000 is already in use` / `Port 5173 is in use` | Close the other copy of the app (or change `PORT` / `VITE_API_URL` together) |
| Website says "Cannot reach the backend" | Backend not running, or `VITE_API_URL` port differs from `PORT`; restart the frontend after editing `.env` |
| "Wrong network" banner | Click **Switch to Hardhat Local**, or select it in MetaMask |
| "Not authorized" banner | Switch MetaMask to Account #0 (the account that ran `npm run deploy`) |
| "No contract found at the configured address" / "not deployed" | The blockchain was restarted: run `npm run deploy` and refresh |
| MetaMask error "nonce too high" / transactions stuck after restarting the blockchain | MetaMask > Settings > Advanced > **Clear activity tab data** |
| Registered but "saving to database failed" | Fix MongoDB/backend, then click **Retry saving** (the on-chain registration is not repeated) |
| Old products show **INVALID** after a restart | Expected: the new blockchain has no record of them. Register new products |
| Camera does not start | Allow camera permission in the browser address bar; use `localhost` (not an IP); close other apps using the camera; or use manual entry |
| Blank page in browser | Press `F12` > Console for the error; make sure `npm run frontend` shows no errors |

## Prerequisite links (official)
- VS Code: <https://code.visualstudio.com/download>
- Node.js LTS: <https://nodejs.org/en/download> (older versions: <https://nodejs.org/en/about/previous-releases>)
- MongoDB Community Server: <https://www.mongodb.com/try/download/community>
- MongoDB Atlas: <https://www.mongodb.com/cloud/atlas/register>
- MetaMask: <https://metamask.io/download/>
