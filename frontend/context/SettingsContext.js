import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = "/api";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const defaultSettings = {
  site_name: "Habitat",
  contact_email: "info@example.com",
  contact_phone: "(123) 456-7890",
  contact_address: "123 Main St, Anytown, USA",
  office_latitude: "10.491", // Default latitude (Caracas center approx)
  office_longitude: "-66.879", // Default longitude (Caracas center approx)
  facebook_profile_url: "#",
  instagram_profile_url: "#",
  tiktok_profile_url: "#",
  linkedin_profile_url: "#",
  whatsapp_contact_url: "#",
  about_page_main_title: "Sobre Nosotros (Default Title)",
  about_page_main_paragraph: "Comprometidos con encontrar tu espacio ideal. (Default paragraph)",
  about_page_mission_title: "Nuestra Misión (Default Title)",
  about_page_mission_paragraph: "Facilitar a nuestros clientes el proceso... (Default paragraph)",
  about_page_vision_title: "Nuestra Visión (Default Title)",
  about_page_vision_paragraph: "Ser la agencia inmobiliaria líder... (Default paragraph)",
  about_page_history_title: "Nuestra Historia",
  about_page_history_paragraph: "Con más de una década de experiencia...",
  footer_tagline: "Tu socio confiable en bienes raíces.",
  primary_font: "Montserrat",
  secondary_font: "Raleway",
  // Theme Colors (matching keys from seed_data.py)
  theme_primary_color: "#282e4b",
  theme_secondary_color: "#242c3c",
  theme_accent_color: "#c8a773",
  theme_text_color_on_dark: "#FFFFFF",
  theme_background_primary: "#1A1A1A",
  theme_background_secondary: "#1f2937", // Tailwind gray-800
  theme_header_background_color: "#f3f4f6",    // Tailwind gray-100 (public header)
  theme_header_text_color: "#111827",    // Tailwind gray-900 (public header text)
  theme_footer_background_color: "#f3f4f6",    // Tailwind gray-100
  theme_footer_text_color: "#111827",    // Tailwind gray-900
  theme_border_color: "#4b5563",       // Tailwind gray-600
  theme_success_color: "#16a34a",      // Tailwind green-600
  theme_error_color: "#dc2626",       // Tailwind red-600
  theme_info_color: "#3b82f6",        // Tailwind blue-500
  theme_warning_color: "#eab308",     // Tailwind yellow-500
  theme_text_color_primary_lightbg: "#111827", // Tailwind gray-900
  theme_text_color_secondary_lightbg: "#6b7280", // Tailwind gray-500
  home_background_url: "/images/default-hero-bg.jpg", // Default background image
  // Remove old individual color settings if they are now covered by theme_*
  primary_color: "#282e4b", // Will be overridden by theme_primary_color if fetched
  secondary_color: "#242c3c",
  accent_color: "#c8a773",
  text_color: "#FFFFFF", // Should use theme_text_color_on_dark
  background_color: "#1A1A1A", // Should use theme_background_primary
  // Add other expected settings with fallbacks
  non_admin_can_view_all_contacts: true, // Match the default in seed_data.py
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Apply a base dark theme immediately to avoid white flash
  useEffect(() => {
    document.body.style.backgroundColor = defaultSettings.theme_background_primary;
    document.body.style.color = defaultSettings.theme_text_color_on_dark;
    document.documentElement.style.setProperty('--color-background-primary', defaultSettings.theme_background_primary);
    document.documentElement.style.setProperty('--color-text-on-dark', defaultSettings.theme_text_color_on_dark);
    document.body.style.fontFamily = `${defaultSettings.primary_font}, sans-serif`;
    // Set default body background image properties
    if (defaultSettings.home_background_url) {
        document.body.style.backgroundImage = `url(${defaultSettings.home_background_url})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundAttachment = 'fixed'; // Or 'scroll'
    }
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (!res.ok) {
          console.error("Failed to fetch settings, using defaults.");
          setSettings(defaultSettings);
        } else {
          const data = await res.json();
          const formattedSettings = {};
          for (const key in data) {
            // Colors and URLs are stored as direct strings. Others might be {text: "..."}
            if (key.endsWith('_color') || key.endsWith('_url')) {
              formattedSettings[key] = data[key].value; // Expecting string value
            } else {
              const val = data[key].value;
              formattedSettings[key] = typeof val === 'object' && val !== null && 'text' in val ? val.text : val;
            }
          }
          setSettings(prev => ({ ...defaultSettings, ...formattedSettings }));
        }
      } catch (error) {
        console.error("Error fetching site settings:", error);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!loading) {
      const root = document.documentElement;
      // Apply all theme_* colors as CSS variables
      for (const key in settings) {
        if (key.startsWith('theme_') && key.endsWith('_color')) {
          const cssVarName = `--color-${key.replace(/^theme_/, '').replace(/_/g, '-').replace('-color', '')}`;
          // Ensure fallback to defaultSettings if a specific setting is somehow null/undefined from fetched data
          root.style.setProperty(cssVarName, settings[key] || defaultSettings[key]);
        }
      }

      root.style.setProperty('--font-primary', settings.primary_font || defaultSettings.primary_font);
      root.style.setProperty('--font-secondary', settings.secondary_font || defaultSettings.secondary_font);
      
      document.body.style.fontFamily = `var(--font-primary), sans-serif`;
      document.body.style.backgroundColor = `var(--color-background-primary)`;
      document.body.style.color = `var(--color-text-on-dark)`;

      // Apply background image from settings
      const bodyBgUrl = settings.home_background_url || defaultSettings.home_background_url;
      if (bodyBgUrl) {
        document.body.style.backgroundImage = `url(${bodyBgUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundAttachment = 'fixed'; // Or 'scroll'
      } else {
        document.body.style.backgroundImage = 'none'; // Remove image if URL is empty
      }
    }
  }, [settings, loading]);

  const getSetting = (key, fallback = null) => {
    // Prefer theme_ specific key if available for colors, then general key, then fallback
    // Ensure this logic correctly handles the new consistent _color suffix if a component tries to get a color without it.
    // For example, if a component calls getSetting('theme_primary') it should still resolve to theme_primary_color's value.
    // However, components should ideally use the full correct key.
    let valueToReturn = settings[key];

    if (valueToReturn === undefined) {
      // Try with _color suffix if the key starts with theme_ but doesn't end with _color
      if (key.startsWith('theme_') && !key.endsWith('_color')) {
        const keyWithColorSuffix = `${key}_color`;
        if (settings[keyWithColorSuffix] !== undefined) {
          valueToReturn = settings[keyWithColorSuffix];
        }
      }
    }

    return valueToReturn !== undefined ? valueToReturn : (fallback !== null ? fallback : (defaultSettings[key] !== undefined ? defaultSettings[key] : defaultSettings[`${key}_color`]));
  };

  return (
    <SettingsContext.Provider value={{ settings, getSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}; 