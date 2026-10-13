import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ELEMENT_ID = "qr-reader";

export default function QRScanner({ onScan, disabled }) {
  const scannerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setRunning(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* camera already stopped */
    }
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  async function start() {
    setError("");
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;
    const config = { fps: 10, qrbox: { width: 240, height: 240 } };
    const handleDecoded = async (text) => {
      await stop();
      onScan(text);
    };
    try {
      try {
        await scanner.start({ facingMode: "environment" }, config, handleDecoded, () => {});
      } catch {
        // Laptops usually have no rear camera: fall back to the first available camera.
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) throw new Error("No camera found on this device.");
        await scanner.start(cameras[0].id, config, handleDecoded, () => {});
      }
      setRunning(true);
    } catch (err) {
      scannerRef.current = null;
      const text = String(err && err.message ? err.message : err);
      setError(
        /permission|denied|NotAllowed/i.test(text)
          ? "Camera permission was denied. Allow camera access in the browser address bar, or use the manual entry box."
          : `Could not start the camera: ${text}. You can use the manual entry box instead.`
      );
    }
  }

  return (
    <div>
      <div id={ELEMENT_ID} className="qr-reader" />
      {error && <p className="field-error">{error}</p>}
      <div className="row">
        {!running ? (
          <button className="btn btn-primary" onClick={start} disabled={disabled}>
            {"\u{1F4F7}"} Start camera scan
          </button>
        ) : (
          <button className="btn btn-outline" onClick={stop}>Stop camera</button>
        )}
      </div>
    </div>
  );
}
