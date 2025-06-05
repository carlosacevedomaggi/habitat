// Determine if the code is running on the server or client
const IS_SERVER = typeof window === 'undefined';

// Define API_BASE based on environment
// For SSR (server-side), use the internal Docker network address for the proxy if NEXT_PUBLIC_API_URL is relative.
// For client-side, use NEXT_PUBLIC_API_URL (which might be relative or absolute).
let apiBase;

if (IS_SERVER) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'; // Default to /api if not set
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    apiBase = apiUrl; // Use directly if it's a full URL
  } else {
    // Ensure leading slash for relative paths if NEXT_PUBLIC_API_URL is like 'api' instead of '/api'
    const relativePath = apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`;
    apiBase = `http://proxy${relativePath}`; // Prepend proxy
  }
} else {
  apiBase = process.env.NEXT_PUBLIC_API_URL || '/api'; // Fallback to /api for client
}

export async function fetchSiteSettings() {
  const fetchUrl = `${apiBase}/settings/`;
  // console.log("[SettingsService] Attempting to fetch from URL:", fetchUrl); // For debugging
  const res = await fetch(fetchUrl);
  if (!res.ok) {
    // console.error("[SettingsService] Failed fetching settings. Status:", res.status, "URL:", fetchUrl, "Response:", await res.text()); // For debugging
    throw new Error(`Failed to fetch site settings. Status: ${res.status}. URL: ${fetchUrl}`);
  }
  return res.json();
}