// Placeholder for Single Property Detail Page
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import ImageCarousel from '../../components/ImageCarousel';
import MapDisplay from '../../components/Map';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_ROOT = '/api';

export default function PropertyDetailPage() {
  const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    property_id: id, // Pre-fill property_id
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (id) {
      setLoading(true);
      // Fetch property details
      fetch(`${API_ROOT}/properties/${id}/`)
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) throw new Error('Propiedad no encontrada.');
            throw new Error('Error al cargar los detalles de la propiedad.');
          }
          return res.json();
        })
        .then(data => {
          setProperty(data);
          setContactForm(prev => ({ ...prev, property_id: data.id, message: `Hola, me interesa la propiedad "${data.title}" (ID: ${data.id}).` }));
          
          // After successfully loading property, track the click
          fetch(`${API_ROOT}/properties/${data.id}/track-click`, { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json' // Though body is empty, good practice
            }
            // No body is needed, backend will get IP/User-Agent from request
          })
          .then(clickRes => {
            if (!clickRes.ok) {
              // Non-critical error, just log it, don't bother user
              clickRes.json().then(errData => {
                console.warn('Failed to track property click:', errData.detail || clickRes.statusText);
              }).catch(() => {
                console.warn('Failed to track property click and parse error response:', clickRes.statusText);
              });
            }
            // else { console.log('Property click tracked'); }
          })
          .catch(clickErr => {
            // Also non-critical
            console.warn('Error sending property click tracking request:', clickErr);
          });

        })
        .catch(err => {
          console.error("Property fetch error:", err);
          setError(err.message);
          // toast.error(err.message); // Already handled by error display
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`${API_ROOT}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.');
        setContactForm({ name: '', email: '', phone: '', message: `Interesado en propiedad ID: ${id}`, property_id: id });
      } else {
        toast.error(data.detail || 'Error al enviar el mensaje.');
        throw new Error(data.detail || 'Error al enviar el mensaje.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-300">Cargando detalles de la propiedad...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  if (!property) return <div className="text-center py-10 text-gray-400">Propiedad no encontrada.</div>;

  // Prepare images for carousel: main image first, then additional images
  const defaultImage = '/images/default-property-bg.jpg';

  const getFullImageUrl = (relativeOrAbsoluteUrl) => {
    if (!relativeOrAbsoluteUrl) return defaultImage;
    if (relativeOrAbsoluteUrl.startsWith('http')) {
      return relativeOrAbsoluteUrl; // Already absolute
    }
    // Check if it's a backend static path (e.g., /static/uploads/...)
    if (relativeOrAbsoluteUrl.startsWith('/static/') && NEXT_PUBLIC_API_BASE_URL) {
      return `${NEXT_PUBLIC_API_BASE_URL}${relativeOrAbsoluteUrl}`;
    }
    // Assume other paths starting with '/' are for the frontend public directory or handled by Next.js
    if (relativeOrAbsoluteUrl.startsWith('/')) {
      return relativeOrAbsoluteUrl;
    }
    return defaultImage; // Fallback for unknown formats
  };

  const carouselImages = [];
  // Process the main image
  const mainImageUrl = getFullImageUrl(property.image_url);
  carouselImages.push({
    image_url: mainImageUrl,
    alt: property.title || `Property Image` // Main image alt
  });

  // Process additional images
  if (property.images && property.images.length > 0) {
    property.images.forEach((img, index) => {
      const additionalImageUrl = getFullImageUrl(img.image_url);
      // Add only if it's different from the main image that's already added
      if (additionalImageUrl !== mainImageUrl) {
        carouselImages.push({
          image_url: additionalImageUrl,
          alt: `${property.title || 'Property Image'} - Imagen adicional ${img.order !== undefined ? img.order + 1 : index + 1}`
        });
      }
    });
  }
  // At this point, carouselImages contains at least one image (mainImageUrl, which could be defaultImage).

  return (
    <>
      <Head>
        <title>{`${property.title} - Habitat`}</title>
        <meta name="description" content={property.description.substring(0, 160)} />
        {/* Leaflet script and CSS are now loaded globally via _app.js and _document.js */}
      </Head>

      <article className="max-w-6xl mx-auto px-4 py-8 text-white">
        {/* Hero/Header Section for Property */}
        <section className="mb-8 md:mb-12">
          {carouselImages.length > 0 ? (
            <ImageCarousel images={carouselImages} imageClassName="w-full h-72 md:h-[500px] object-cover rounded-xl shadow-2xl" />
          ) : (
            <div className="w-full h-72 md:h-[500px] bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 shadow-2xl">
              No hay imágenes disponibles
            </div>
          )}
          <div className="mt-6 bg-gray-800 p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl md:text-4xl font-bold text-accent mb-3">{property.title}</h1>
            <p className="text-xl text-gray-400 mb-2 flex items-center">
              <i className="fas fa-map-marker-alt mr-2 text-accent"></i>{property.location}
            </p>
            <p className="text-2xl font-semibold text-accent mb-4">${property.price ? property.price.toLocaleString() : 'N/A'}</p>
            <div className="flex flex-wrap gap-4 text-sm mb-2">
                <span className="bg-gray-700 px-3 py-1 rounded-full text-gray-300">{property.property_type}</span>
                <span className="bg-gray-700 px-3 py-1 rounded-full text-gray-300">{property.listing_type}</span>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold text-accent mb-4">Detalles de la Propiedad</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-gray-300 mb-6">
                {property.bedrooms && <div className="flex items-center"><i className="fas fa-bed mr-2 text-accent"></i> {property.bedrooms} Habitaciones</div>}
                {property.bathrooms && <div className="flex items-center"><i className="fas fa-bath mr-2 text-accent"></i> {property.bathrooms} Baños</div>}
                {property.square_feet && <div className="flex items-center"><i className="fas fa-ruler-combined mr-2 text-accent"></i> {property.square_feet} m²</div>}
              </div>
              <h3 className="text-xl font-semibold text-accent mb-2">Descripción</h3>
              <p className="text-gray-300 whitespace-pre-line leading-relaxed">{property.description}</p>
            </section>

            {property.latitude != null && property.longitude != null && (
              <section className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-accent mb-4">Ubicación</h2>
                <MapDisplay 
                  latitude={property.latitude}
                  longitude={property.longitude} 
                  mapClassName="h-80 w-full rounded-lg shadow-md"
                  markerTitle={property.title}
                />
              </section>
            )}
          </div>

          {/* Sidebar with Contact Form */}
          <aside className="md:col-span-1">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg sticky top-24">
              <h2 className="text-2xl font-semibold text-accent mb-4">Contactar Anunciante</h2>
              {formError && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{formError}</p>}
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                  <input type="text" name="name" id="name" required value={contactForm.name} onChange={handleContactChange} className="w-full input-style" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                  <input type="email" name="email" id="email" required value={contactForm.email} onChange={handleContactChange} className="w-full input-style" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Teléfono (Opcional)</label>
                  <input type="tel" name="phone" id="phone" value={contactForm.phone} onChange={handleContactChange} className="w-full input-style" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Mensaje</label>
                  <textarea name="message" id="message" rows="4" required value={contactForm.message} onChange={handleContactChange} className="w-full input-style"></textarea>
                </div>
                <button type="submit" disabled={formSubmitting} className="w-full btn-submit-loading">
                  {formSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>}
                  {formSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </article>
      <style jsx>{`
        .input-style { @apply w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent; }
        .btn-submit-loading {
          display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent;
          font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; 
          padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 0.625rem; padding-bottom: 0.625rem; 
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
          color: #1f2937; background-color: var(--color-accent);
        }
        .btn-submit-loading:hover { background-color: rgba(var(--color-accent-rgb, 200 167 115), 0.8); }
        .btn-submit-loading:focus { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--color-gray-800, #1f2937), 0 0 0 4px var(--color-accent); }
        .btn-submit-loading:disabled { opacity: 0.5; }
        .btn-submit-loading svg { animation: spin 1s linear infinite; margin-left: -0.25rem; margin-right: 0.75rem; height: 1.25rem; width: 1.25rem; }
      `}</style>
    </>
  );
} 