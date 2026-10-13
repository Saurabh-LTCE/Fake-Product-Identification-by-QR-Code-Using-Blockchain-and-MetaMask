const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${BASE}. Is it running? (npm run backend)`);
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* body was not JSON */
  }
  if (!response.ok) {
    const err = new Error((data && data.message) || `Request failed (HTTP ${response.status})`);
    err.status = response.status;
    err.details = data && data.errors;
    throw err;
  }
  return data;
}

/** Returns the product or null when it is not in the database. */
export async function getProduct(productId) {
  try {
    const data = await request(`/products/${encodeURIComponent(productId)}`);
    return data.product;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function createProduct(payload) {
  const data = await request("/products", { method: "POST", body: JSON.stringify(payload) });
  return data.product;
}

export async function listProducts() {
  const data = await request("/products");
  return data.products;
}

export async function verifyProduct(productId, source = "manual") {
  return request(`/verify/${encodeURIComponent(productId)}?source=${encodeURIComponent(source)}`);
}

export async function getScans(productId = "") {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  const data = await request(`/scans${query}`);
  return data.scans;
}
