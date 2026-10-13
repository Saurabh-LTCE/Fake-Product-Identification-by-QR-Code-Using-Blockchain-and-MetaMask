import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../components/ToastProvider";
import Spinner from "../components/Spinner";
import { createProduct, getProduct, listProducts } from "../services/api";
import { friendlyError, isRegisteredOnChain, registerProductOnChain, EXPECTED_CHAIN_ID } from "../services/blockchain";
import { computeProductHash } from "../services/productHash";
import { buildVerifyUrl, todayISO, validateProduct } from "../services/validation";

const EMPTY = { productId: "", productName: "", manufacturerName: "", batchNumber: "", manufacturingDate: "", description: "" };
const STEPS = ["Check for duplicates", "Approve in MetaMask", "Wait for blockchain confirmation", "Save details to database", "Generate QR code"];

export default function Manufacturer() {
  const wallet = useWallet();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const [recent, setRecent] = useState([]);
  const [recentError, setRecentError] = useState("");

  const loadRecent = useCallback(async () => {
    try {
      setRecent(await listProducts());
      setRecentError("");
    } catch (err) {
      setRecentError(err.message);
    }
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function finishAfterChain(values, txHash) {
    setStep(3);
    try {
      await createProduct({ ...values, txHash });
    } catch (err) {
      setPendingSave({ values, txHash });
      throw new Error(
        `The product IS registered on the blockchain, but saving to the database failed: ${err.message} Click "Retry saving" below.`
      );
    }
    setPendingSave(null);
    setStep(4);
    const verifyUrl = buildVerifyUrl(values.productId);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 420, margin: 2, errorCorrectionLevel: "M" });
    setResult({ values, txHash, verifyUrl, qrDataUrl });
    setStep(5);
    notify("success", `Product ${values.productId} registered and QR code created.`);
    loadRecent();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);
    const { errors: found, values } = validateProduct(form);
    setErrors(found);
    if (Object.keys(found).length) {
      notify("error", "Please fix the highlighted fields.");
      return;
    }
    if (!wallet.ready) {
      notify("error", "Connect an authorized MetaMask account on the Hardhat network first.");
      return;
    }
    setBusy(true);
    setPendingSave(null);
    try {
      setStep(0);
      if (await getProduct(values.productId)) throw new Error(`Product ID "${values.productId}" already exists in the database. Use a different ID.`);
      if (await isRegisteredOnChain(values.productId)) throw new Error(`Product ID "${values.productId}" is already registered on the blockchain. Use a different ID.`);

      const dataHash = computeProductHash(values);
      setStep(1);
      const { txHash } = await registerProductOnChain(values.productId, dataHash, () => setStep(2));
      await finishAfterChain(values, txHash);
    } catch (err) {
      notify("error", friendlyError(err));
      setStep(-1);
    } finally {
      setBusy(false);
    }
  }

  async function retrySave() {
    if (!pendingSave) return;
    setBusy(true);
    try {
      await finishAfterChain(pendingSave.values, pendingSave.txHash);
    } catch (err) {
      notify("error", friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  function downloadQr() {
    const a = document.createElement("a");
    a.href = result.qrDataUrl;
    a.download = `qr-${result.values.productId}.png`;
    a.click();
  }

  function reset() {
    setForm(EMPTY);
    setResult(null);
    setStep(-1);
    setErrors({});
  }

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} value={form[name]} onChange={(e) => update(name, e.target.value)} disabled={busy} className={errors[name] ? "invalid" : ""} {...props} />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </div>
  );

  return (
    <>
      <h1 className="page-title">Manufacturer Dashboard</h1>
      <WalletStatus wallet={wallet} />

      <div className="grid grid-2">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h2>Register a product</h2>
          <div className="grid grid-2 tight">
            {field("productId", "Product ID", { placeholder: "e.g. P1001", maxLength: 64 })}
            {field("productName", "Product name", { placeholder: "e.g. Organic Green Tea", maxLength: 100 })}
            {field("manufacturerName", "Manufacturer name", { placeholder: "e.g. GreenLeaf Pvt Ltd", maxLength: 100 })}
            {field("batchNumber", "Batch number", { placeholder: "e.g. B-2026-04", maxLength: 50 })}
            {field("manufacturingDate", "Manufacturing date", { type: "date", max: todayISO() })}
          </div>
          <div className="field">
            <label htmlFor="description">Product description</label>
            <textarea id="description" rows={4} maxLength={1000} value={form.description} onChange={(e) => update("description", e.target.value)} disabled={busy} className={errors.description ? "invalid" : ""} />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>
          <button className="btn btn-primary btn-large" type="submit" disabled={busy || !wallet.ready}>
            {busy ? <Spinner label="Working..." /> : "Register on blockchain"}
          </button>
          {!wallet.ready && <p className="hint">The button unlocks once an authorized MetaMask account is connected to the Hardhat network.</p>}
        </form>

        <div className="card">
          <h2>Progress</h2>
          <ol className="progress">
            {STEPS.map((label, i) => (
              <li key={label} className={i < step ? "done" : i === step ? "active" : ""}>
                <span className="progress-dot">{i < step ? "\u2714" : i + 1}</span>
                <span>{label}{i === step && busy ? "..." : ""}</span>
              </li>
            ))}
          </ol>
          {step === 1 && <p className="hint">A MetaMask window should open. Click <b>Confirm</b> to approve the transaction.</p>}
          {pendingSave && (
            <div className="alert alert-warn">
              <p>Registered on-chain (tx <span className="mono">{pendingSave.txHash.slice(0, 12)}...</span>) but not yet saved in MongoDB.</p>
              <button className="btn btn-primary btn-small" onClick={retrySave} disabled={busy}>Retry saving</button>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="card result-card">
          <h2>{"\u2705"} Product registered</h2>
          <div className="grid grid-2">
            <div className="center">
              <img className="qr-image" src={result.qrDataUrl} alt={`QR code for ${result.values.productId}`} />
              <div className="row center-row">
                <button className="btn btn-primary" onClick={downloadQr}>Download QR (PNG)</button>
                <button className="btn btn-outline" onClick={reset}>Register another</button>
              </div>
            </div>
            <table className="details">
              <tbody>
                <tr><th>Product ID</th><td>{result.values.productId}</td></tr>
                <tr><th>Name</th><td>{result.values.productName}</td></tr>
                <tr><th>Manufacturer</th><td>{result.values.manufacturerName}</td></tr>
                <tr><th>Batch</th><td>{result.values.batchNumber}</td></tr>
                <tr><th>Manufactured</th><td>{result.values.manufacturingDate}</td></tr>
                <tr><th>Transaction</th><td className="mono wrap">{result.txHash}</td></tr>
                <tr><th>QR contains</th><td className="mono wrap">{result.verifyUrl}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="row between">
          <h2>Recent registrations</h2>
          <button className="btn btn-outline btn-small" onClick={loadRecent}>Refresh</button>
        </div>
        {recentError && <p className="field-error">{recentError}</p>}
        {!recentError && recent.length === 0 && <p className="hint">No products registered yet.</p>}
        {recent.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product ID</th><th>Name</th><th>Batch</th><th>Registered</th><th /></tr></thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.productId}>
                    <td className="mono">{p.productId}</td>
                    <td>{p.productName}</td>
                    <td>{p.batchNumber}</td>
                    <td>{new Date(p.blockchainTimestamp * 1000).toLocaleString()}</td>
                    <td><Link to={`/verify?productId=${encodeURIComponent(p.productId)}`}>Verify</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function WalletStatus({ wallet }) {
  const { hasMetaMask, account, correctNetwork, authorized, contractProblem, walletError, connect, switchNetwork, connecting } = wallet;

  if (!hasMetaMask)
    return (
      <div className="alert alert-bad">
        <b>MetaMask was not detected.</b> Install the extension from{" "}
        <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">metamask.io/download</a>, then reload this page.
      </div>
    );
  if (!account)
    return (
      <div className="alert alert-info">
        <p><b>Connect your wallet</b> to register products. Use the local Hardhat test account described in the installation guide - never a real wallet.</p>
        <button className="btn btn-primary" onClick={connect} disabled={connecting}>Connect MetaMask</button>
        {walletError && <p className="field-error">{walletError}</p>}
      </div>
    );
  if (!correctNetwork)
    return (
      <div className="alert alert-warn">
        <p><b>Wrong network.</b> MetaMask must be on "Hardhat Local" (chain ID {EXPECTED_CHAIN_ID}, RPC http://127.0.0.1:8545).</p>
        <button className="btn btn-warn" onClick={switchNetwork}>Switch to Hardhat Local</button>
        {walletError && <p className="field-error">{walletError}</p>}
      </div>
    );
  if (contractProblem) return <div className="alert alert-bad"><b>Contract problem:</b> {contractProblem}</div>;
  if (authorized === false)
    return (
      <div className="alert alert-bad">
        <b>Not authorized.</b> <span className="mono">{account}</span> is not an authorized manufacturer. Only the account that deployed the contract
        (Hardhat account #0) can register products. Switch accounts in MetaMask.
      </div>
    );
  if (authorized === null) return <div className="alert alert-info"><Spinner label="Checking authorization..." /></div>;
  return (
    <div className="alert alert-ok">
      <b>Ready.</b> Connected as <span className="mono">{account}</span> - authorized manufacturer on Hardhat Local.
    </div>
  );
}
