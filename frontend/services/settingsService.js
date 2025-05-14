const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export async function fetchSiteSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) {
    throw new Error('Failed to fetch site settings');
  }
  return res.json();
} 