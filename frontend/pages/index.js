import HeroSection from '../components/HeroSection';
import PropertySlider from '../components/PropertySlider';
import { fetchSiteSettings } from '../services/settingsService';
import { fetchProperties } from '../services/propertyService';
import { useSettings } from '../context/SettingsContext';
import Head from 'next/head';

export default function HomePage({ featuredProperties, recentProperties }) {
  const { getSetting, loading: settingsLoading } = useSettings();
  const siteName = settingsLoading ? 'Habitat' : getSetting('site_name', 'Habitat Real Estate');

  return (
    <>
      <Head>
        <title>{siteName}</title>
        <meta name="description" content={getSetting('site_description', 'Encuentra tu propiedad ideal en Caracas.')} />
      </Head>
      <HeroSection />
      <div className="py-12 bg-transparent">
        <div className="container mx-auto px-4">
          {/* TODO: Highlight featured properties, testimonials, etc. */}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  try {
    // Optionally fetch site settings for dynamic content
    await fetchSiteSettings();
    // Fetch all properties
    const properties = await fetchProperties();
    const featuredProperties = properties.filter(p => p.is_featured).slice(0, 10);
    const recentProperties = properties
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
    return {
      props: {
        featuredProperties,
        recentProperties,
      },
    };
  } catch (error) {
    console.error('Failed to load home page data', error);
    return {
      props: {
        featuredProperties: [],
        recentProperties: [],
      },
    };
  }
} 