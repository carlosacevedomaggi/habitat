import { useSettings } from '../context/SettingsContext';
import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image component

export default function Footer() {
  const { getSetting, loading } = useSettings();

  const year = new Date().getFullYear();
  const siteName = loading ? "Habitat" : getSetting('site_name', "Habitat");

  // Social links - ensure these keys match your SiteSettings keys
  const socialLinks = [
    { key: 'facebook_profile_url', icon: 'fab fa-facebook-f', label: 'Facebook' },
    { key: 'instagram_profile_url', icon: 'fab fa-instagram', label: 'Instagram' },
    { key: 'tiktok_profile_url', icon: 'fab fa-tiktok', label: 'TikTok' },
    { key: 'linkedin_profile_url', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
    { key: 'whatsapp_contact_url', icon: 'fab fa-whatsapp', label: 'WhatsApp' },
  ];

  return (
    <footer className="bg-theme-footer-background text-theme-footer-text py-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left px-4">
        <div>
          <h3 className="text-xl font-semibold text-accent mb-4">{siteName}</h3>
          <p className="text-sm">
            {loading ? "Tu socio confiable en bienes raíces." : getSetting('footer_tagline', 'Tu socio confiable en bienes raíces.')}
          </p>
          <div className="flex justify-center md:justify-start space-x-4 mt-4">
            {socialLinks.map(social => {
              const url = getSetting(social.key);
              if (url && url !== '#') {
                return (
                  <a key={social.key} href={url} target="_blank" rel="noopener noreferrer" aria-label={social.label} 
                     className="text-accent hover:text-primary transition-colors">
                    <i className={`${social.icon} text-2xl`}></i>
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-accent mb-4">Enlaces Rápidos</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/properties" className="hover:text-accent transition-colors">Propiedades</Link></li>
            <li><Link href="/about" className="hover:text-accent transition-colors">Nosotros</Link></li>
            <li><Link href="/contact" className="hover:text-accent transition-colors">Contacto</Link></li>
            {/* Add other links as needed, e.g., terms, privacy policy */}
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-accent mb-4">Contacto</h3>
          <address className="text-sm not-italic space-y-2">
            {getSetting('contact_address') && <p><i className="fas fa-map-marker-alt mr-2 text-accent"></i>{getSetting('contact_address')}</p>}
            {getSetting('contact_phone') && <p><i className="fas fa-phone mr-2 text-accent"></i>{getSetting('contact_phone')}</p>}
            {getSetting('contact_email') && <p><i className="fas fa-envelope mr-2 text-accent"></i>{getSetting('contact_email')}</p>}
          </address>
        </div>
      </div>
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left text-sm mt-8 pt-8 border-t border-theme-border">
        <div className="mb-4 md:mb-0">
          <Link href="/" legacyBehavior passHref>
            <a className="inline-block hover:opacity-80 transition-opacity">
              <Image 
                src="/images/HABITAT_ICON.png" // Path relative to public directory
                alt={`${siteName} Icon`}
                width={40} // Adjust as needed
                height={40} // Adjust as needed
                className="object-contain"
              />
            </a>
          </Link>
        </div>
        <p>&copy; {year} {siteName}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
} 