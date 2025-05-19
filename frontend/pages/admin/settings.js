import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useSettings } from '../../context/SettingsContext'; // Import useSettings

const API_BASE = '/api';

// Define categories for grouping settings
const settingCategories = ["General", "Contact", "Social", "AboutPage", "Footer", "Appearance", "Permissions"];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { settings: contextSettings, loading: contextLoading, getSetting, refreshSettings } = useSettings(); // Get settings from context
  const [settingsData, setSettingsData] = useState({}); // Local state for modifications
  const [initialSettingsData, setInitialSettingsData] = useState({}); // To compare for changes
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('General');

  useEffect(() => {
    if (!contextLoading && contextSettings) {
      // Initialize local state with all settings from context, ensuring correct structure
      const initialData = {};
      for (const key in contextSettings) {
        // Use getSetting to ensure correct value format (handles {text: ...} vs direct value)
        const valueFromContext = getSetting(key); 
        initialData[key] = {
          value: valueFromContext,
          // Attempt to find category from SITE_SETTINGS in seed_data or default to 'General'
          // This is a simplification; ideally, category comes from API or is predefined mapping
          category: contextSettings[key]?.category || deduceCategory(key) 
        };
      }
      setSettingsData(initialData);
      setInitialSettingsData(JSON.parse(JSON.stringify(initialData))); // Deep copy for comparison
    }
  }, [contextLoading, contextSettings, getSetting]);

  // Helper to deduce category if not provided (basic example)
  const deduceCategory = (key) => {
    if (key.includes('contact_') || key.includes('office_')) return 'Contact';
    if (key.includes('facebook_') || key.includes('instagram_') || key.includes('tiktok_') || key.includes('linkedin_') || key.includes('whatsapp_')) return 'Social';
    if (key.includes('about_page_')) return 'AboutPage';
    if (key.includes('footer_')) return 'Footer';
    if (key.startsWith('theme_') || key === 'home_background_url') return 'Appearance';
    if (key === 'non_admin_can_view_all_contacts') return 'Permissions';
    return 'General';
  };


  const handleChange = (key, inputValue, category) => {
    setSettingsData(prev => {
      const newSetting = { ...prev[key] }; // Copy existing setting properties
      newSetting.value = inputValue; // Update value
      if (category) { // Update category if provided
        newSetting.category = category;
      } else if (!newSetting.category) { // Assign default if no category exists
        newSetting.category = 'General';
      }
      return { ...prev, [key]: newSetting };
    });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error("Authentication required.");
      router.push('/admin/login');
      setIsSaving(false);
      return;
    }

    // Construct payload with all settings, structured as the backend expects
    // The backend PUT /api/settings expects a flat dictionary of {key: {value: ..., category: ...}}
    const payload = {};
    for (const key in settingsData) {
        // Ensure the value sent to backend is the direct value, not {text: ...} if it was just for display
        let valueToSave = settingsData[key].value;
        if (typeof valueToSave === 'object' && valueToSave !== null && 'text' in valueToSave && !key.endsWith('_color') && !key.endsWith('_url')) {
            // This case should ideally not happen if getSetting and handleChange are robust
            // but as a safeguard, extract .text if it's an object and not a color/url
            // However, booleans and direct strings (like colors/URLs) should be saved directly.
            // The main issue is frontend displaying {text: "..."} for some fields.
            // Backend expects direct value for SiteSettings.value (JSON)
        }
        payload[key] = {
             value: settingsData[key].value, // Send the raw value (string, boolean, number, or object if JSON)
             category: settingsData[key].category || 'General' 
        };
    }

    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to save settings." }));
        throw new Error(errData.detail);
      }
      toast.success('Settings updated successfully!');
      setInitialSettingsData(JSON.parse(JSON.stringify(settingsData))); // Update baseline
      await refreshSettings();
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (contextLoading) {
    return <AdminLayout title="Site Settings"><div className="text-center py-10">Loading settings...</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Site Settings">
      <Head>
        <title>Site Settings - Habitat Admin</title>
      </Head>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-semibold text-accent">Site Settings</h1>
          {/* Category Navigation */}
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {settingCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none whitespace-nowrap ${activeCategory === category ? 'bg-accent text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

          <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="bg-red-500 text-white p-3 rounded-md text-center">{error}</div>}

          {/* Render settings based on activeCategory */}
          {settingsData && Object.entries(settingsData)
            .filter(([key, setting]) => setting.category === activeCategory)
            .map(([key, setting]) => {
              const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
              
              // Special handling for boolean for the checkbox
              if (key === 'non_admin_can_view_all_contacts' && activeCategory === 'Permissions') {
                return (
                  <div key={key} className="bg-gray-700 p-4 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.value === true} // Ensure boolean comparison
                        onChange={(e) => handleChange(key, e.target.checked, 'Permissions')}
                        className="form-checkbox h-5 w-5 text-accent bg-gray-600 border-gray-500 rounded focus:ring-accent"
                      />
                      <span className="ml-3 text-gray-300">{label}</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Key: {key} | Category: {setting.category}</p>
                  </div>
                );
              }
              
              // Handle other types (text, number, could expand to textarea etc.)
              // For simple text inputs:
              if (typeof setting.value === 'string' || typeof setting.value === 'number') {
                return (
                  <div key={key} className="bg-gray-700 p-4 rounded-lg">
                    <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                    <input
                      type={typeof setting.value === 'number' ? 'number' : 'text'}
                      id={key}
                      name={key}
                      value={setting.value || ''}
                      onChange={(e) => handleChange(key, e.target.value, setting.category)}
                      className="input-style"
                    />
                    <p className="text-xs text-gray-500 mt-1">Key: {key} | Category: {setting.category}</p>
                  </div>
                );
              }
              
              // Fallback for complex objects or unhandled - could be JSON editor or specific inputs
              // For this example, we'll render a stringified version if it's an object not handled above
              if (typeof setting.value === 'object' && setting.value !== null) {
                    return (
                  <div key={key} className="bg-gray-700 p-4 rounded-lg">
                    <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-1">{label} (JSON)</label>
                          <textarea 
                      id={key}
                      name={key}
                      value={JSON.stringify(setting.value, null, 2)}
                      onChange={(e) => {
                        try {
                          handleChange(key, JSON.parse(e.target.value), setting.category);
                        } catch (parseError) {
                          // Maybe set a temp error state for this field
                          console.warn("Invalid JSON for", key);
                        }
                      }}
                            rows="3"
                      className="input-style font-mono text-xs"
                    />
                    <p className="text-xs text-gray-500 mt-1">Key: {key} | Category: {setting.category}</p>
                      </div>
                    );
              }
              return null; // Should not happen if data is well-formed
          })}
          
          {/* Save button only if there are changes and not in ThemeColors category (handled by Appearance page) */}
          {activeCategory !== 'ThemeColors' && JSON.stringify(settingsData) !== JSON.stringify(initialSettingsData) && (
            <div className="flex justify-end pt-6">
              <button type="submit" disabled={isSaving} className="btn-primary flex items-center">
                {isSaving && <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
          </form>
      </div>
      <style jsx>{`
        .input-style { 
          @apply w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent; 
        }
        .btn-primary {
          @apply px-6 py-2.5 bg-accent text-gray-900 font-medium text-sm rounded-md shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-accent disabled:opacity-50;
        }
        /* Style for category tabs */
        .flex.space-x-1 button { /* More specific selector */
          /* ... */
        }
      `}</style>
    </AdminLayout>
  );
} 