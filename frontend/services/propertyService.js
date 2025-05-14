const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export async function fetchProperties(query = "") {
  const res = await fetch(`${API_BASE}/properties${query}`);
  if (!res.ok) {
    throw new Error("Failed fetching properties");
  }
  return res.json();
}

export async function fetchProperty(id) {
  const res = await fetch(`${API_BASE}/properties/${id}`);
  if (!res.ok) {
    throw new Error("Property not found");
  }
  return res.json();
} 