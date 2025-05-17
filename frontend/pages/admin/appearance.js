import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useRouter } from 'next/router';
// import Image from 'next/image';
import { toast } from 'react-toastify';

const API_BASE = '/api';

// Helper to generate a display label from a setting key
const formatKeyToLabel = (key) => {
  return key.replace(/^theme_/, '').replace(/_/g, ' ').replace(/color/gi, 'Color').replace(/bg/gi, 'Background').replace(/lightbg/gi, 'on Light Background')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Define the structure for organizing theme colors
const colorSections = [
  {
    title: "General Site Theme",
    keys: ["theme_primary_color", "theme_secondary_color", "theme_accent_color"]
  },
  {
    title: "Text Colors",
    keys: ["theme_text_color_on_dark", "theme_text_color_primary_lightbg", "theme_text_color_secondary_lightbg"]
  },
  {
    title: "Background Colors",
    keys: ["theme_background_primary", "theme_background_secondary"]
  },
  {
    title: "Header",
    keys: ["theme_header_background_color", "theme_header_text_color"]
  },
  {
    title: "Footer",
    keys: ["theme_footer_background_color", "theme_footer_text_color"]
  },
  {
    title: "UI Feedback Colors",
    keys: ["theme_success_color", "theme_error_color", "theme_info_color", "theme_warning_color"]
  },
  {
    title: "Borders & Dividers",
    keys: ["theme_border_color"]
  }
  // Add more sections and keys as needed
];

export default function AppearancePage() {
  const router = useRouter();
  const [allSettings, setAllSettings] = useState({}); // To store all settings from API
  const [themeColorSettings, setThemeColorSettings] = useState({}); // Filtered for ThemeColors
  const [homeBgUrl, setHomeBgUrl] = useState('');
  
  const [bgFile, setBgFile] = useState(null);
  const [isSavingBg, setIsSavingBg] = useState(false);
  const [isSavingColors, setIsSavingColors] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchAllSettings = async () => {
      setLoadingSettings(true);
      setError('');
      const token = localStorage.getItem('habitat_admin_token');
      if (!token) {
        toast.error("Authentication required.");
        router.push('/admin/login');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/settings`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({detail: "Failed to fetch settings"}));
            throw new Error(errData.detail);
        }
        const data = await res.json();
        setAllSettings(data); // Store all settings

        // Normalize background URL to a relative path
        const rawBg = data?.home_background_url?.value || '';
        let bgPath = rawBg;
        try {
          if (rawBg.startsWith('http')) {
            bgPath = new URL(rawBg).pathname;
          }
        } catch {
          /* ignore malformed URL */
        }
        setHomeBgUrl(bgPath);
        
        const structuredColors = {};
        colorSections.forEach(section => {
          section.keys.forEach(key => {
            if (data[key] && data[key].category === 'ThemeColors') {
              if (!structuredColors[section.title]) {
                structuredColors[section.title] = [];
              }
              structuredColors[section.title].push({
                key: key,
                label: formatKeyToLabel(key),
                value: data[key].value,
                category: data[key].category
              });
            }
          });
        });
        setThemeColorSettings(structuredColors);

      } catch (err) {
        console.error(err);
        setError(err.message);
        toast.error(err.message || "Could not load settings.");
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchAllSettings();
  }, [router]);

  const handleBgFileChange = (e) => {
    if (e.target.files?.[0]) {
      setBgFile(e.target.files[0]);
    }
  };

  const handleColorChange = (sectionTitle, key, colorValue) => {
    setThemeColorSettings(prev => {
      const newSections = { ...prev };
      const sectionItems = newSections[sectionTitle].map(item => {
        if (item.key === key) {
          return { ...item, value: colorValue };
        }
        return item;
      });
      newSections[sectionTitle] = sectionItems;
      return newSections;
    });

    // Also update allSettings to prepare for submission
    setAllSettings(prevAll => ({
      ...prevAll,
      [key]: { ...(prevAll[key] || { category: 'ThemeColors' }), value: colorValue }
    }));
  };
  
  const handleSaveThemeColors = async (e) => {
    e.preventDefault();
    setIsSavingColors(true);
    setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) { toast.error("Authentication required."); router.push('/admin/login'); setIsSavingColors(false); return; }

    // Construct payload from allSettings, as it's already being updated by handleColorChange
    // This ensures we only send theme colors that were potentially modified and retain others.
    const settingsToUpdate = { ...allSettings };
    // No, we need to ensure all settings are sent, not just theme colors, as per backend PUT endpoint
    // The backend expects the full settings object to be PUT.
    // allSettings should correctly reflect the latest modifications to theme colors
    // and preserve all other non-theme settings.
    
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsToUpdate), // Send the complete allSettings object
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({detail: "Failed to save theme colors."}));
        throw new Error(errData.detail);
      }
      toast.success('Theme colors updated successfully!');
      // Optionally re-fetch or update context if it doesn't auto-update
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message || "Failed to save theme colors.");
    } finally {
      setIsSavingColors(false);
    }
  };


  const handleBackgroundSubmit = async (e) => {
    e.preventDefault();
    if (!bgFile) { toast.info("Please select an image file first."); return; }
    setIsSavingBg(true);
    setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) { toast.error("Authentication required."); router.push('/admin/login'); setIsSavingBg(false); return; }

    let uploadedImageUrl = homeBgUrl; // Keep current if upload fails or no new file

    try {
      // 1. Upload new image if a file is selected
      if (bgFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', bgFile);
        const uploadRes = await fetch(`${API_BASE}/uploads/general`, { // Assuming a 'general' type for site assets
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: imageFormData,
        });
        if (!uploadRes.ok) {
            const errUploadData = await uploadRes.json().catch(() => ({detail: "Background image upload failed."}));
            throw new Error(errUploadData.detail);
        }
        const uploadData = await uploadRes.json();
        uploadedImageUrl = uploadData.url;
      }

      // 2. Update the home_background_url setting
      const settingsToUpdate = {
        ...allSettings, // Preserve other settings
        home_background_url: { // Key for the background image URL
          value: uploadedImageUrl, // Direct string URL
          category: 'Appearance', // Category for this setting
        }
      };
      
      const settingsRes = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsToUpdate),
      });
      if (!settingsRes.ok) {
        const errSettingsData = await settingsRes.json().catch(() => ({detail: "Failed to update background setting."}));
        throw new Error(errSettingsData.detail);
      }

      setHomeBgUrl(uploadedImageUrl);
      setBgFile(null); // Clear file input
      setAllSettings(settingsToUpdate); // Keep allSettings in sync
      toast.success('Background image updated successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSavingBg(false);
    }
  };
  
  const handleRemoveBackgroundImage = async () => {
    if (!window.confirm("Are you sure you want to remove the background image? This will revert to the default background color.")) return;
    setIsSavingBg(true);
    setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) { toast.error("Authentication required."); router.push('/admin/login'); setIsSavingBg(false); return; }

    try {
      const settingsToUpdate = {
        ...allSettings,
        home_background_url: {
          value: "", // Set to empty string to remove
          category: 'Appearance',
        }
      };
      
      const settingsRes = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsToUpdate),
      });
      if (!settingsRes.ok) {
        const errSettingsData = await settingsRes.json().catch(() => ({detail: "Failed to remove background image."}));
        throw new Error(errSettingsData.detail);
      }
      setHomeBgUrl("");
      setAllSettings(settingsToUpdate); // Keep allSettings in sync
      toast.success('Background image removed.');
    } catch (err) {
        console.error(err);
        setError(err.message);
        toast.error(err.message || "Failed to remove background image.");
    } finally {
        setIsSavingBg(false);
    }
  };


  if (loadingSettings) {
    return <AdminLayout title="Appearance Settings"><div className="text-center py-10">Loading settings...</div></AdminLayout>;
  }
  
  if (error && Object.keys(themeColorSettings).length === 0 && !homeBgUrl && !loadingSettings) {
     return <AdminLayout title="Error"><div className="text-center py-10 text-red-500">Error loading appearance settings: {error}</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Configuración de Apariencia">
      <div className="space-y-12">
        {/* Background Image Section */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-accent mb-6 border-b border-gray-700 pb-3">Imagen de Fondo (Página de Inicio)</h2>
          {error && !isSavingBg && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-sm">{error}</div>}
          <div className="mb-6">
            <h3 className="font-medium mb-2 text-gray-300">Fondo Actual:</h3>
            {homeBgUrl ? (
              <img src={homeBgUrl} alt="Current Hero Background" className="object-cover rounded-md shadow" />
            ) : (
              <p className="text-gray-400">No hay imagen de fondo configurada. Se usará el color de fondo primario.</p>
            )}
          </div>
          <form onSubmit={handleBackgroundSubmit} className="space-y-4">
            <div>
              <label htmlFor="bgFile" className="block mb-1 font-medium text-gray-300">Subir nueva imagen de fondo:</label>
              <input
                type="file"
                id="bgFile"
                accept="image/*"
                onChange={handleBgFileChange}
                className="input-file-style"
              />
               {bgFile && <p className="text-xs text-gray-400 mt-1">Seleccionado: {bgFile.name}</p>}
            </div>
            <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={isSavingBg || !bgFile}
                  className="btn-primary flex items-center"
                >
                  {isSavingBg && <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>}
                  {isSavingBg ? 'Guardando...' : 'Guardar Nueva Imagen'}
                </button>
                {homeBgUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveBackgroundImage}
                      disabled={isSavingBg}
                      className="btn-danger flex items-center"
                    >
                      {isSavingBg && <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>}
                      Remover Imagen
                    </button>
                )}
            </div>
          </form>
        </section>

        {/* Theme Colors Section */}
        <form onSubmit={handleSaveThemeColors}>
          {Object.entries(themeColorSettings).map(([sectionTitle, items]) => (
            <section key={sectionTitle} className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
              <h2 className="text-2xl font-semibold text-accent mb-6 border-b border-gray-700 pb-3">{sectionTitle}</h2>
              {error && !isSavingColors && sectionTitle === Object.keys(themeColorSettings)[0] && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-sm">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {items.map((setting) => (
                  <div key={setting.key}>
                    <label htmlFor={setting.key} className="block text-sm font-medium text-gray-300 mb-1">
                      {setting.label}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        id={`${setting.key}-picker`}
                        name={`${setting.key}-picker`}
                        value={typeof setting.value === 'string' ? setting.value : '#000000'} // Ensure value is a string for color picker
                        onChange={(e) => handleColorChange(sectionTitle, setting.key, e.target.value)}
                        className="h-10 w-10 p-0 border-none rounded cursor-pointer"
                        style={{ backgroundColor: typeof setting.value === 'string' ? setting.value : '#000000' }}
                        disabled
                      />
                      <input
                        type="text"
                        id={setting.key}
                        name={setting.key}
                        value={typeof setting.value === 'string' ? setting.value : ''}  // Ensure value is a string for text input
                        onChange={(e) => handleColorChange(sectionTitle, setting.key, e.target.value)}
                        className="input-style flex-1"
                        placeholder="#RRGGBB"
                        disabled
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          
          {Object.keys(themeColorSettings).length > 0 && (
              <div className="pt-8 flex justify-end">
                  {/* <button
                  type="submit"
                  disabled={isSavingColors || loadingSettings}
                  className="btn-primary flex items-center text-gray-900"
                  >
                  {isSavingColors && <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>}
                  {isSavingColors ? 'Guardando Colores...' : 'Guardar Todos los Colores del Tema'}
                  </button> */}
              </div>
          )}
        </form>
      </div>
      <style jsx>{`
        .input-style { 
          @apply w-full border rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent;
          background-color: var(--color-header-background); /* Light background */
          color: var(--color-text-primary-lightbg); /* Dark text */
          border-color: var(--color-border);
        }
        .input-file-style { 
          @apply w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold transition-colors;
          color: var(--color-text-secondary-lightbg); /* Lighter text for file input placeholder text */
          file:bg-accent file:text-gray-900 hover:file:bg-opacity-80;
        }
        .btn-primary {
          @apply px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center;
          background-color: var(--color-accent);
          color: var(--color-text-on-dark); /* Text on accent button should be dark if accent is light, or light if accent is dark */
        }
        .btn-primary:hover {
          filter: brightness(90%);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-danger {
          @apply px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center;
          background-color: var(--color-error);
          color: var(--color-text-on-dark);
        }
        .btn-danger:hover {
          filter: brightness(90%);
        }
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </AdminLayout>
  );
} 