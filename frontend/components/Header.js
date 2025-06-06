// Placeholder for Header Component
import Link from 'next/link';
import Navigation from './Navigation';
import { useSettings } from '../context/SettingsContext';
import Image from 'next/image'; // Import Next.js Image component

export default function Header() {
  const { getSetting, loading } = useSettings();
  const siteName = loading ? 'Habitat' : getSetting('site_name', 'Habitat');

  return (
    <header className="bg-theme-header-background text-theme-header-text shadow-md sticky top-0 z-[1000]">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" legacyBehavior passHref>
          <a className="flex items-center space-x-2 text-2xl font-bold text-accent hover:opacity-80 transition-opacity">
            <Image
              src="/images/HABITAT_LOGO_BLK.png" // Path relative to public directory
              alt={`${siteName} Logo`}
              width={160}
              height={60}
              className="object-contain" // Ensures image scales nicely
            />
            {/* Optionally, keep site name next to logo or remove it */}
            {/* <span className="hidden md:inline">{siteName}</span> */}
          </a>
        </Link>
        <Navigation />
      </div>
    </header>
  );
} 