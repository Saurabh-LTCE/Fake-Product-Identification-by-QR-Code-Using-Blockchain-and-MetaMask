import { useCallback, useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import Spinner from "../components/Spinner";
import { getScans } from "../services/api";

export default function History() {
  const [filter, setFilter] = useState("");
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (productId = "") => {
    setLoading(true);
    setError("");
    try {
      setScans(await getScans(productId.trim()));
    } catch (err) {
      setError(err.message);
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <h1 className="page-title">Scan History</h1>
      <div className="card">
        <form className="row" onSubmit={(e) => { e.preventDefault(); load(filter); }}>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by Product ID (optional)" className="grow" />
          <button className="btn btn-primary" type="submit">Search</button>
          <button className="btn btn-outline" type="button" onClick={() => { setFilter(""); load(""); }}>Show all</button>
        </form>

        {loading && <p><Spinner label="Loading..." /></p>}
        {error && <p className="field-error">{error}</p>}
        {!loading && !error && scans.length === 0 && <p className="hint">No verification attempts recorded yet.</p>}

        {scans.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Time</th><th>Product ID</th><th>Result</th><th>Via</th><th>Note</th></tr></thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.scannedAt).toLocaleString()}</td>
                    <td className="mono">{s.productId}</td>
                    <td><StatusBadge result={s.result} /></td>
                    <td>{s.source}</td>
                    <td>{s.suspicious ? <span className="badge badge-warn">Repeated scans - review</span> : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="hint">"Repeated scans" is only a hint that a code was checked unusually often. It does not prove a product is counterfeit.</p>
      </div>
    </>
  );
}
