import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import QRScanner from "../components/QRScanner";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/ToastProvider";
import { verifyProduct } from "../services/api";
import { extractProductId } from "../services/validation";

export default function Verify() {
  const [params, setParams] = useSearchParams();
  const { notify } = useToast();
  const [manualId, setManualId] = useState(params.get("productId") || "");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [requestError, setRequestError] = useState("");
  const autoRan = useRef(false);

  const runVerification = useCallback(
    async (rawId, source) => {
      const productId = extractProductId(rawId);
      if (!productId) {
        notify("error", "Please enter or scan a Product ID.");
        return;
      }
      setLoading(true);
      setOutcome(null);
      setRequestError("");
      setManualId(productId);
      try {
        setOutcome(await verifyProduct(productId, source));
      } catch (err) {
        setRequestError(err.message);
        notify("error", err.message);
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  // Opened from a QR code link: /verify?productId=P1001
  useEffect(() => {
    const id = params.get("productId");
    if (id && !autoRan.current) {
      autoRan.current = true;
      runVerification(id, "link");
    }
  }, [params, runVerification]);

  function handleScan(text) {
    const id = extractProductId(text);
    setParams({ productId: id });
    autoRan.current = true;
    runVerification(id, "qr");
  }

  function handleManual(e) {
    e.preventDefault();
    setParams(manualId.trim() ? { productId: manualId.trim() } : {});
    autoRan.current = true;
    runVerification(manualId, "manual");
  }

  return (
    <>
      <h1 className="page-title">Verify a Product</h1>
      <div className="grid grid-2">
        <div className="card">
          <h2>Scan the QR code</h2>
          <p className="hint">Allow camera access when the browser asks.</p>
          <QRScanner onScan={handleScan} disabled={loading} />
        </div>
        <form className="card" onSubmit={handleManual}>
          <h2>Or enter the Product ID</h2>
          <div className="field">
            <label htmlFor="manualId">Product ID</label>
            <input id="manualId" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="e.g. P1001" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <Spinner label="Checking blockchain..." /> : "Verify"}
          </button>
        </form>
      </div>

      {loading && <div className="card center"><Spinner label="Reading the blockchain and database..." /></div>}
      {requestError && <div className="alert alert-bad"><b>ERROR:</b> {requestError}</div>}
      {outcome && <ResultCard outcome={outcome} />}
    </>
  );
}

function ResultCard({ outcome }) {
  const { result, message, product, chain, computedHash, suspicious, suspiciousReason, scanLogged, productId } = outcome;
  return (
    <div className={`card result-card result-${result}`}>
      <div className="row between">
        <StatusBadge result={result} large />
        <span className="mono">{productId}</span>
      </div>
      <p className="result-message">{message}</p>

      {suspicious && <div className="alert alert-warn"><b>Unusual activity:</b> {suspiciousReason}</div>}
      {!scanLogged && <div className="alert alert-info">This scan could not be saved to the history (database unavailable).</div>}

      {product && (
        <table className="details">
          <tbody>
            <tr><th>Product name</th><td>{product.productName}</td></tr>
            <tr><th>Manufacturer</th><td>{product.manufacturerName}</td></tr>
            <tr><th>Batch number</th><td>{product.batchNumber}</td></tr>
            <tr><th>Manufacturing date</th><td>{product.manufacturingDate}</td></tr>
            <tr><th>Description</th><td>{product.description}</td></tr>
          </tbody>
        </table>
      )}

      {chain && chain.registered && (
        <>
          <h3>Blockchain record</h3>
          <table className="details">
            <tbody>
              <tr><th>Registered at</th><td>{new Date(chain.registeredAt * 1000).toLocaleString()}</td></tr>
              <tr><th>Registered by</th><td className="mono wrap">{chain.registeredBy}</td></tr>
              <tr><th>Hash on blockchain</th><td className="mono wrap">{chain.dataHash}</td></tr>
              {computedHash && <tr><th>Hash of stored data</th><td className="mono wrap">{computedHash}</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
