import { useState } from 'react';
import Head from 'next/head';
import { useSettings } from '../context/SettingsContext';
import MapDisplay from '../components/Map';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ContactPage() {
  const { getSetting, settings, loading: settingsLoading } = useSettings();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Contacto General desde la Web', // Default subject
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`${API_ROOT}/api/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        // toast.success('Mensaje enviado con éxito! Gracias por contactarnos.');
        alert('Mensaje enviado con éxito! Gracias por contactarnos.');
        setSuccessMessage('Mensaje enviado con éxito! Gracias por contactarnos.');
        setFormData({ name: '', email: '', phone: '', subject: 'Contacto General desde la Web', message: '' });
      } else {
        throw new Error(data.detail || 'Error al enviar el mensaje. Por favor, inténtelo de nuevo.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setError(err.message);
      // toast.error(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const siteName = getSetting('site_name', 'Habitat');
  const contactEmail = getSetting('contact_email', 'info@example.com');
  const contactPhone = getSetting('contact_phone', '(123) 456-7890');
  const contactAddress = getSetting('contact_address', '123 Main St, Anytown, USA');
  // Optional: Coordinates for a map, if you store them in settings
  const officeLatitude = parseFloat(getSetting('office_latitude', null)); 
  const officeLongitude = parseFloat(getSetting('office_longitude', null));

  if (settingsLoading) {
    return <div className="text-center py-10 text-gray-300">Cargando...</div>;
  }

  return (
    <>
      <Head>
        <title>{`Contacto - ${siteName}`}</title>
        <meta name="description" content={`Ponte en contacto con ${siteName}. Estamos aquí para ayudarte.`} />
        {/* Leaflet script and CSS are now loaded globally */}
      </Head>

      <section 
        className="py-20 md:py-28 bg-cover bg-center text-white relative"
        style={{ backgroundImage: `linear-gradient(rgba(var(--color-primary-rgb, 40 46 75), 0.88), rgba(var(--color-secondary-rgb, 36 44 60), 0.92)), url(${getSetting('contact_hero_image_url', '/images/default-hero-bg.jpg')})` }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-down">{getSetting('contact_page_title', 'Ponte en Contacto')}</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up">
            {getSetting('contact_page_subtitle', '¿Tienes preguntas o necesitas asistencia? Nuestro equipo está listo para ayudarte.')}
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Contact Form */}
            <div className="bg-gray-700 p-8 rounded-xl shadow-xl">
              <h2 className="text-2xl font-semibold text-accent mb-6">Envíanos un Mensaje</h2>
              {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
              {successMessage && <p className="text-green-400 bg-green-900/50 p-3 rounded-md mb-4">{successMessage}</p>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo *</label>
                  <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="w-full input-style" placeholder="Tu nombre"/>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico *</label>
                  <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="w-full input-style" placeholder="tu@email.com"/>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Teléfono (Opcional)</label>
                  <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="w-full input-style" placeholder="+1 (555) 123-4567"/>
                </div>
                 <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Asunto</label>
                  <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} className="w-full input-style" placeholder="Asunto de tu mensaje"/>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Mensaje *</label>
                  <textarea name="message" id="message" rows="5" required value={formData.message} onChange={handleChange} className="w-full input-style" placeholder="Escribe tu consulta aquí..."></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full btn-submit-loading text-base">
                  {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>}
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            </div>

            {/* Contact Info & Map */}
            <div className="space-y-8">
              <div className="bg-gray-700 p-8 rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold text-accent mb-6">Información de Contacto</h2>
                <div className="space-y-4 text-gray-300">
                  {contactAddress && <p className="flex items-start"><i className="fas fa-map-marker-alt fa-fw mr-3 mt-1 text-accent"></i><span>{contactAddress}</span></p>}
                  {contactPhone && <p className="flex items-center"><i className="fas fa-phone fa-fw mr-3 text-accent"></i><a href={`tel:${contactPhone}`} className="hover:text-accent">{contactPhone}</a></p>}
                  {contactEmail && <p className="flex items-center"><i className="fas fa-envelope fa-fw mr-3 text-accent"></i><a href={`mailto:${contactEmail}`} className="hover:text-accent">{contactEmail}</a></p>}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-600 flex space-x-4">
                    {getSetting('facebook_profile_url') && <a href={getSetting('facebook_profile_url')} target="_blank" rel="noopener noreferrer" className="social-icon hover:text-accent"><i className="fab fa-facebook-f"></i></a>}
                    {getSetting('instagram_profile_url') && <a href={getSetting('instagram_profile_url')} target="_blank" rel="noopener noreferrer" className="social-icon hover:text-accent"><i className="fab fa-instagram"></i></a>}
                    {getSetting('linkedin_profile_url') && <a href={getSetting('linkedin_profile_url')} target="_blank" rel="noopener noreferrer" className="social-icon hover:text-accent"><i className="fab fa-linkedin-in"></i></a>}
                    {getSetting('tiktok_profile_url') && <a href={getSetting('tiktok_profile_url')} target="_blank" rel="noopener noreferrer" className="social-icon hover:text-accent"><i className="fab fa-tiktok"></i></a>}
                    {getSetting('whatsapp_contact_url') && <a href={getSetting('whatsapp_contact_url')} target="_blank" rel="noopener noreferrer" className="social-icon hover:text-accent"><i className="fab fa-whatsapp"></i></a>}
                </div>
              </div>
              
              {Number.isFinite(officeLatitude) && Number.isFinite(officeLongitude) && (
                <div className="bg-gray-700 p-8 rounded-xl shadow-xl">
                    <h3 className="text-xl font-semibold text-accent mb-4">Nuestra Ubicación</h3>
                    <MapDisplay latitude={officeLatitude} longitude={officeLongitude} zoom={15} mapClassName="h-72 w-full rounded-lg" markerTitle="Nuestra Oficina" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`
        /* .input-style is now defined globally and uses !important */
        .btn-submit-loading {
          display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent;
          font-weight: 500; border-radius: 0.375rem; 
          padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 0.75rem; padding-bottom: 0.75rem; 
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
          color: #1f2937; background-color: var(--color-accent);
        }
        .btn-submit-loading:hover { background-color: rgba(var(--color-accent-rgb, 200 167 115), 0.85); }
        .btn-submit-loading:focus { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--color-gray-800, #1f2937), 0 0 0 4px var(--color-accent); }
        .btn-submit-loading:disabled { opacity: 0.5; }
        .btn-submit-loading svg { animation: spin 1s linear infinite; margin-right: 0.75rem; height: 1.25rem; width: 1.25rem; }
        .social-icon { @apply text-gray-400 text-2xl; }
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out 0.2s both; }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-25px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
} 