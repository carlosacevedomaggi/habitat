import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useRouter } from 'next/router';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export default function AppearancePage() {
  const router = useRouter();
  const [bgUrl, setBgUrl] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const data = await res.json();
          setBgUrl(data?.home_background?.value?.url || '');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    const token = localStorage.getItem('habitat_admin_token');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE}/uploads/general`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // Update setting
      const settingsPayload = {
        home_background: {
          value: { url: imageUrl },
          category: 'Appearance',
        },
      };
      const settingsRes = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsPayload),
      });
      if (!settingsRes.ok) throw new Error('Failed to update settings');

      setBgUrl(imageUrl);
      setFile(null);
      alert('Background updated');
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Appearance Settings">
      <h1 className="text-2xl font-semibold mb-6">Home Page Appearance</h1>
      <div className="mb-8">
        <h2 className="font-medium mb-2">Current Hero Background</h2>
        {bgUrl ? (
          <Image src={bgUrl} alt="Hero Background" width={600} height={300} className="object-cover rounded" />
        ) : (
          <p>No background set.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Upload new background image (high-resolution):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary/80 px-6 py-2 rounded text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </AdminLayout>
  );
} 