import HeroSection from '../components/HeroSection';
import { fetchSiteSettings } from '../services/settingsService';

export default function HomePage({ backgroundUrl }) {
  return (
    <>
      <HeroSection backgroundUrl={backgroundUrl} />
      {/* TODO: Highlight featured properties, testimonials, etc. */}
    </>
  );
}

export async function getServerSideProps() {
  try {
    const settings = await fetchSiteSettings();
    const bgSetting = settings?.home_background || null;
    const backgroundUrl = bgSetting?.value?.url ||
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1920&q=80'; // fallback hero image

    return { props: { backgroundUrl } };
  } catch (error) {
    console.error('Failed to load site settings', error);
    return {
      props: {
        backgroundUrl:
          'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1920&q=80',
      },
    };
  }
} 