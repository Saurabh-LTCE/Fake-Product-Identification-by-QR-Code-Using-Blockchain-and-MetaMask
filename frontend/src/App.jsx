import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Manufacturer from "./pages/Manufacturer.jsx";
import Verify from "./pages/Verify.jsx";
import History from "./pages/History.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manufacturer" element={<Manufacturer />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/history" element={<History />} />
          <Route
            path="*"
            element={
              <div className="card center">
                <h2>Page not found</h2>
                <Link className="btn btn-primary" to="/">Go home</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="footer">College Blockchain mini project - local Hardhat demo, no real cryptocurrency.</footer>
    </>
  );
}
