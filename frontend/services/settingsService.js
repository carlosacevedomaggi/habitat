// Determine if the code is running on the server or client
const IS_SERVER = typeof window === 'undefined';

// Define API_BASE based on environment
// For SSR (server-side), use the internal Docker network address for the proxy if NEXT_PUBLIC_API_URL is relative.
// For client-side, use NEXT_PUBLIC_API_URL (which might be relative or absolute).
let apiBase;
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
    console.error("[SettingsService] Error parsing NEXT_PUBLIC_API_URL for SSR, defaulting path to /api:", e);
    pathSegment = '/api';
  }
  
  if (pathSegment && !pathSegment.startsWith('/')) {
      pathSegment = `/${pathSegment}`;
  }
  if (pathSegment.length > 1 && pathSegment.endsWith('/')) {
      pathSegment = pathSegment.slice(0, -1);
  }

  apiBase = `http://proxy${pathSegment}`;
  // console.log(`[SettingsService SSR] NEXT_PUBLIC_API_URL: "${process.env.NEXT_PUBLIC_API_URL}", Runtime API URL: "${runtimeApiUrl}", Path Segment: "${pathSegment}", Resolved API_BASE for SSR: "${apiBase}"`);

} else {
  apiBase = runtimeApiUrl;
  // console.log(`[SettingsService CSR] NEXT_PUBLIC_API_URL: "${process.env.NEXT_PUBLIC_API_URL}", Resolved API_BASE for CSR: "${apiBase}"`);
}

export async function fetchSiteSettings() {
  // Ensure the final URL doesn't have double slashes if apiBase ends with / and settings/ starts with /
  // However, our pathSegment logic above ensures apiBase (for SSR) does not end with a slash if path is not just "/"
  // And /settings/ is a fixed path.
  const endpoint = '/settings/'; // Ensure endpoint starts with a slash
  const fetchUrl = `${apiBase}${endpoint}`;
  // console.log("[SettingsService] Attempting to fetch from URL:", fetchUrl); // For debugging
  const res = await fetch(fetchUrl);
  if (!res.ok) {
    // console.error("[SettingsService] Failed fetching settings. Status:", res.status, "URL:", fetchUrl, "Response:", await res.text()); // For debugging
    throw new Error(`Failed to fetch site settings. Status: ${res.status}. URL: ${fetchUrl}`);
  }
  return res.json();
}