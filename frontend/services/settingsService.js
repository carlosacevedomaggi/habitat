const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"; // Fallback for local dev outside Docker, uses proxy

export async function fetchSiteSettings() {
  const res = await fetch(`${API_BASE_URL}/settings/`);
  if (!res.ok) {
    throw new Error('Failed to fetch site settings');
  }
  return res.json();
} 