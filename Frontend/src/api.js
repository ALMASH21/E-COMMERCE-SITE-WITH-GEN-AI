const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: options.body
        ? { "Content-Type": "application/json", ...options.headers }
        : options.headers,
    });
  } catch {
    throw new Error("Unable to connect to the server. Check that the backend is running.");
  }

  const contentType = response.headers.get("content-type") || "";
  let result = {};
  if (contentType.includes("application/json")) {
    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  }
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status}).`);
  }
  if (!contentType.includes("application/json")) {
    throw new Error("The server returned an unexpected response.");
  }
  return result;
}

export function toCatalogProduct(product) {
  return {
    ...product,
    id: product._id,
    rating: product.rating || "4.8",
    image: product.image || "",
    alt: product.name,
    inStock: product.stock > 0,
    handFinished: product.handFinished !== false,
  };
}
