import { NavLink, Link } from "react-router-dom";
import WalletButton from "./WalletButton";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-logo">{"\u{1F6E1}"}</span> AuthentiChain
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/manufacturer">Manufacturer</NavLink>
          <NavLink to="/verify">Verify</NavLink>
          <NavLink to="/history">Scan History</NavLink>
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
