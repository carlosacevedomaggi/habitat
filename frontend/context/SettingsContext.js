import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const defaultSettings = {
  site_name: "Habitat",
  contact_email: "info@example.com",
  contact_phone: "(123) 456-7890",
  contact_address: "123 Main St, Anytown, USA",
  facebook_profile_url: "#",
  instagram_profile_url: "#",
  tiktok_profile_url: "#",
  linkedin_profile_url: "#",
  whatsapp_contact_url: "#",
  primary_font: "Montserrat",
  secondary_font: "Raleway",
  primary_color: "#282e4b",      // Default dark blue/purple
  secondary_color: "#242c3c",  // Default darker blue/gray
  accent_color: "#c8a773",      // Default gold
  text_color: "#FFFFFF",         // Default white for dark themes
  background_color: "#1A1A1A", // Default dark gray
  // Add other expected settings with fallbacks
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (!res.ok) {
          console.error("Failed to fetch settings, using defaults.");
          setSettings(defaultSettings);
        } else {
          const data = await res.json();
          // The API returns settings as { key: { key, value, category } }
          // We need to transform it to { key: value }
          const formattedSettings = {};
          for (const key in data) {
            const val = data[key].value;
            formattedSettings[key] = typeof val === 'object' && val !== null && 'text' in val ? val.text : val;
          }
          setSettings(prev => ({ ...defaultSettings, ...formattedSettings }));
        }
      } catch (error) {
        console.error("Error fetching site settings:", error);
        setSettings(defaultSettings); // Fallback to defaults on error
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Apply theme variables to the root element
  useEffect(() => {
    if (!loading) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', settings.primary_color || defaultSettings.primary_color);
      root.style.setProperty('--color-secondary', settings.secondary_color || defaultSettings.secondary_color);
      root.style.setProperty('--color-accent', settings.accent_color || defaultSettings.accent_color);
      root.style.setProperty('--color-text', settings.text_color || defaultSettings.text_color);
      root.style.setProperty('--color-background', settings.background_color || defaultSettings.background_color);
      // A simple way to derive a darker primary, adjust as needed
      const primaryDark = settings.primary_color ? `${settings.primary_color}dd` : `${defaultSettings.primary_color}dd`;
      root.style.setProperty('--color-primary-dark', primaryDark);

      root.style.setProperty('--font-primary', settings.primary_font || defaultSettings.primary_font);
      root.style.setProperty('--font-secondary', settings.secondary_font || defaultSettings.secondary_font);
      
      // Apply background color to body
      document.body.style.backgroundColor = settings.background_color || defaultSettings.background_color;
      document.body.style.color = settings.text_color || defaultSettings.text_color;
      document.body.style.fontFamily = `var(--font-primary), sans-serif`;
    }
  }, [settings, loading]);

  const getSetting = (key, fallback = null) => {
    return settings[key] || fallback || defaultSettings[key] || null;
  };

  return (
    <SettingsContext.Provider value={{ settings, getSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}; 