import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';
// import { toast } from 'react-toastify';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Define categories for grouping settings - this could also be fetched if dynamic
const settingCategories = {
  general: "General Site Info",
  contact: "Contact Information",
  social: "Social Media Links",
  theme: "Theme & Appearance",
  // Add more categories as they are defined in your backend SiteSettings model/data
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({}); // Store as object: { key: {value, category, ...} }
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true); setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) { router.push('/admin/login'); return; }

    try {
      const res = await fetch(`${API_ROOT}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }, // Settings GET might be protected
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data); // API returns { key: { key, value, category } }
    } catch (err) {
      setError(err.message || 'Could not load settings.');
      // toast.error(err.message || 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) { router.push('/admin/login'); setIsSubmitting(false); return; }

    // Prepare data in the format expected by the backend { key: { value: ..., category: ...} }
    const settingsToUpdate = {};
    for (const key in settings) {
        settingsToUpdate[key] = { 
            value: settings[key].value, 
            category: settings[key].category 
        };
    }

    try {
      const res = await fetch(`${API_ROOT}/api/settings/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settingsToUpdate),
      });
      const data = await res.json(); // Even on success, API returns updated settings
      if (res.ok) {
        // toast.success('Settings updated successfully!');
        alert('Settings updated successfully!');
        setSettings(data); // Update state with potentially processed data from backend
      } else {
        throw new Error(data.detail || 'Failed to update settings.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      // toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Group settings by category for rendering
  const groupedSettings = {};
  for (const key in settings) {
    const category = settings[key].category || 'general';
    if (!groupedSettings[category]) {
      groupedSettings[category] = [];
    }
    groupedSettings[category].push({ ...settings[key], key }); // Add key to the object for easy access
  }

  return (
    <AdminLayout title="Site Settings">
      <Head><title>Site Settings - Habitat Admin</title></Head>
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-accent">Site Settings</h1>
        </div>

        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-6 text-center">Error: {error}</div>}
        {loading && <p className="text-gray-400 text-center">Loading settings...</p>}

        {!loading && Object.keys(settings).length === 0 && !error && (
          <p className="text-gray-400 text-center">No settings found or unable to load.</p>
        )}

        {!loading && Object.keys(settings).length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {Object.entries(groupedSettings).map(([categoryKey, categorySettings]) => (
              <section key={categoryKey} className="p-6 bg-gray-700 rounded-lg">
                <h2 className="text-xl font-semibold text-accent mb-4 capitalize border-b border-gray-600 pb-2">
                  {settingCategories[categoryKey.toLowerCase()] || categoryKey.replace(/_/g, ' ')}
                </h2>
                <div className="space-y-4">
                  {categorySettings.sort((a,b) => a.key.localeCompare(b.key)).map(setting => {
                    // Determine input type based on key or expected value type
                    let inputType = 'text';
                    if (typeof setting.value === 'boolean') inputType = 'checkbox';
                    else if (typeof setting.value === 'number') inputType = 'number';
                    else if (setting.key.includes('color')) inputType = 'color';
                    else if (setting.key.includes('url') || setting.key.includes('link')) inputType = 'url';
                    else if (setting.key.includes('email')) inputType = 'email';
                    else if (setting.key.includes('phone')) inputType = 'tel';
                    else if (setting.key.includes('description') || setting.key.includes('text') || setting.key.includes('message')) inputType = 'textarea';
                    
                    const value = typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value;

                    return (
                      <div key={setting.key}>
                        <label htmlFor={setting.key} className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                          {setting.key.replace(/_/g, ' ')}
                        </label>
                        {inputType === 'textarea' ? (
                          <textarea 
                            name={setting.key} 
                            id={setting.key} 
                            value={value} 
                            onChange={(e) => handleChange(setting.key, e.target.value)} 
                            rows="3"
                            className="w-full input-style"
                          />
                        ) : inputType === 'checkbox' ? (
                          <input 
                            type="checkbox" 
                            name={setting.key} 
                            id={setting.key} 
                            checked={!!setting.value} 
                            onChange={(e) => handleChange(setting.key, e.target.checked)} 
                            className="h-5 w-5 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent"
                          />
                        ) : (
                          <input 
                            type={inputType} 
                            name={setting.key} 
                            id={setting.key} 
                            value={value} 
                            onChange={(e) => handleChange(setting.key, inputType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} 
                            className={`w-full input-style ${inputType === 'color' ? 'h-10 p-1' : ''}`}
                          />
                        )}
                        {/* Optional: Add description from backend if available */}
                        {/* {setting.description && <p className="text-xs text-gray-500 mt-1">{setting.description}</p>} */}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={isSubmitting || loading} className="btn-submit-loading">
                {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
      <style jsx>{`
        .input-style { @apply w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent; }
        .btn-submit-loading {
          display: inline-flex; align-items: center; border: 1px solid transparent;
          font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; 
          padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 0.625rem; padding-bottom: 0.625rem; 
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
          color: #1f2937; background-color: var(--color-accent);
        }
        .btn-submit-loading:hover { background-color: rgba(var(--color-accent-rgb, 200 167 115), 0.8); }
        .btn-submit-loading:focus { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--color-gray-800, #1f2937), 0 0 0 4px var(--color-accent); }
        .btn-submit-loading:disabled { opacity: 0.5; }
        .btn-submit-loading svg { animation: spin 1s linear infinite; margin-left: -0.25rem; margin-right: 0.75rem; height: 1.25rem; width: 1.25rem; }
      `}</style>
    </AdminLayout>
  );
} 