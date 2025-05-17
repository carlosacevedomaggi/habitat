const API_BASE = '/api';

export async function fetchSiteSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) {
    throw new Error('Failed to fetch site settings');
  }
  return res.json();
} 