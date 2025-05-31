// Determine if the code is running on the server or client
const IS_SERVER = typeof window === 'undefined';
console.log("[PropertyService] IS_SERVER:", IS_SERVER);
console.log("[PropertyService] Original NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
console.log("[PropertyService] Original NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

// Define API_BASE based on environment
// For SSR (server-side), use the internal Docker network address for the proxy.
// For client-side, use a relative path which will be handled by the browser and Nginx proxy.
const API_BASE = IS_SERVER
  ? `http://proxy/api` // Corrected for SSR to use internal service discovery and /api path
  : '/api'; // Always use relative /api path for client-side requests

console.log("[PropertyService] Resolved API_BASE:", API_BASE);

export async function fetchProperties(query = "") {
  console.log("[PropertyService] fetchProperties called with query:", query);
  // Ensure the query string starts with '?' if it's not empty and doesn't already have one.
  const queryString = query && !query.startsWith('?') ? `?${query}` : query;
  const fetchUrl = `${API_BASE}/properties${queryString}`;
  console.log("[PropertyService] Attempting to fetch from URL:", fetchUrl);
  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[PropertyService] Failed fetching properties. Status:", res.status, "URL:", fetchUrl, "Response:", errorText);
      throw new Error(`Failed fetching properties. Status: ${res.status}. URL: ${fetchUrl}. Response: ${errorText}`);
    }
    console.log("[PropertyService] Successfully fetched properties from:", fetchUrl);
    return res.json();
  } catch (error) {
    console.error("[PropertyService] Error in fetchProperties:", error, "URL:", fetchUrl);
    throw error; // Re-throw the error to be caught by the caller
  }
}

export async function fetchProperty(id) {
  const fetchUrl = `${API_BASE}/properties/${id}/`;
  console.log("[PropertyService] fetchProperty called for id:", id, "URL:", fetchUrl);
  const res = await fetch(fetchUrl);
  if (!res.ok) {
    const errorText = await res.text();
    console.error("[PropertyService] Failed fetching property. Status:", res.status, "URL:", fetchUrl, "Response:", errorText);
    throw new Error(`Property not found. Status: ${res.status}. URL: ${fetchUrl}. Response: ${errorText}`);
  }
  console.log("[PropertyService] Successfully fetched property from:", fetchUrl);
  return res.json();
}