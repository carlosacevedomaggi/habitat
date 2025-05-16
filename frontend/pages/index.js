import HeroSection from '../components/HeroSection';
import PropertySlider from '../components/PropertySlider';
import { fetchSiteSettings } from '../services/settingsService';
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
    const settings = await fetchSiteSettings();
    const bgSetting = settings?.home_background || null;
    const backgroundUrl = bgSetting?.value?.url ||
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1920&q=80'; // fallback hero image

    // Fetch properties
    // const propertiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/properties`);
    // const propertiesData = await propertiesRes.json();
    // const featuredProperties = propertiesData.filter(p => p.is_featured);
    // const recentProperties = propertiesData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      props: {
        // backgroundUrl, // No longer needed to pass to HomePage for HeroSection
        featuredProperties: featuredProperties.filter(p => p.is_featured).slice(0, 10),
        recentProperties: recentProperties.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10),
      },
    };
  } catch (error) {
    console.error('Failed to load site settings', error);
    return {
      props: {
        // backgroundUrl:
        //   'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1920&q=80',
        featuredProperties: [],
        recentProperties: [],
      },
    };
  }
} 