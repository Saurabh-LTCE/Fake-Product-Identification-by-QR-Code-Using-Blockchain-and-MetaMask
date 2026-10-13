import { useWallet } from "../context/WalletContext";
import Spinner from "./Spinner";

export default function WalletButton() {
  const { hasMetaMask, account, correctNetwork, connecting, connect, switchNetwork } = useWallet();

  if (!hasMetaMask) {
    return (
      <a className="btn btn-outline btn-small" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
        Install MetaMask
      </a>
    );
  }
  if (!account) {
    return (
      <button className="btn btn-primary btn-small" onClick={connect} disabled={connecting}>
        {connecting ? <Spinner label="Connecting" /> : "Connect Wallet"}
      </button>
    );
  }
  return (
    <div className="wallet-chip">
      <span className={`dot ${correctNetwork ? "dot-ok" : "dot-bad"}`} />
      <span className="mono" title={account}>
        {account.slice(0, 6)}...{account.slice(-4)}
      </span>
      {!correctNetwork && (
        <button className="btn btn-warn btn-small" onClick={switchNetwork}>
          Switch to Hardhat
        </button>
      )}
    </div>
  );
}
