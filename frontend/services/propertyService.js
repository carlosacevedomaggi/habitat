// Determine if the code is running on the server or client
const IS_SERVER = typeof window === 'undefined';
console.log("[PropertyService] IS_SERVER:", IS_SERVER);
console.log("[PropertyService] Original NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
console.log("[PropertyService] Original NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

// Define API_BASE based on environment
let API_BASE;
const runtimeApiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'; // Default to /api

if (IS_SERVER) {
  let pathSegment = '/api'; // Default path segment
  try {
    if (runtimeApiUrl.startsWith('http://') || runtimeApiUrl.startsWith('https://')) {
      const urlObject = new URL(runtimeApiUrl);
      pathSegment = urlObject.pathname;
    } else if (runtimeApiUrl.startsWith('/')) {
      pathSegment = runtimeApiUrl;
    } else {
      pathSegment = `/${runtimeApiUrl}`;
    }
  } catch (e) {
    console.error("[PropertyService] Error parsing NEXT_PUBLIC_API_URL for SSR, defaulting path to /api:", e);
    pathSegment = '/api';
  }
  
  if (pathSegment && !pathSegment.startsWith('/')) {
      pathSegment = `/${pathSegment}`;
  }
  if (pathSegment.length > 1 && pathSegment.endsWith('/')) {
      pathSegment = pathSegment.slice(0, -1);
  }

  API_BASE = `http://proxy${pathSegment}`;
  console.log(`[PropertyService SSR] NEXT_PUBLIC_API_URL: "${process.env.NEXT_PUBLIC_API_URL}", Runtime API URL: "${runtimeApiUrl}", Path Segment: "${pathSegment}", Resolved API_BASE for SSR: "${API_BASE}"`);

} else {
  API_BASE = runtimeApiUrl;
  console.log(`[PropertyService CSR] NEXT_PUBLIC_API_URL: "${process.env.NEXT_PUBLIC_API_URL}", Runtime API URL: "${runtimeApiUrl}", Resolved API_BASE for CSR: "${API_BASE}"`);
}

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