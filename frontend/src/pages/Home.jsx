import { Link } from "react-router-dom";

const STEPS = [
  { n: 1, title: "Register", text: "The manufacturer enters product details and approves the registration in MetaMask." },
  { n: 2, title: "Record", text: "The smart contract stores the product ID, a hash (fingerprint) of the data, and a timestamp." },
  { n: 3, title: "Tag", text: "A QR code is generated and attached to the product." },
  { n: 4, title: "Verify", text: "A customer scans the QR code. The data is re-hashed and compared with the blockchain record." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Fake Product Identification by QR Code Using Blockchain and MetaMask</h1>
        <p>
          A demonstration of how blockchain can help customers check whether a product was genuinely registered by its
          manufacturer - and whether its details have been changed since.
        </p>
        <div className="row center-row">
          <Link to="/manufacturer" className="btn btn-primary btn-large">Manufacturer Dashboard</Link>
          <Link to="/verify" className="btn btn-light btn-large">Verify a Product</Link>
        </div>
      </section>

      <section>
        <h2 className="section-title">How it works</h2>
        <div className="grid grid-4">
          {STEPS.map((s) => (
            <div className="card step-card" key={s.n}>
              <div className="step-number">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Built with</h2>
        <div className="grid grid-3">
          <div className="card"><h3>On-chain</h3><p>Solidity smart contract on a local Hardhat blockchain, accessed with ethers.js and MetaMask.</p></div>
          <div className="card"><h3>Off-chain</h3><p>MongoDB stores the full product details and the scan history, served by a Node.js / Express API.</p></div>
          <div className="card"><h3>Trust model</h3><p>A database record alone is never proof. Only the blockchain record and a matching hash give VERIFIED.</p></div>
        </div>
      </section>
    </>
  );
}
