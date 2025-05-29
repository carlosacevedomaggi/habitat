import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useSettings } from '../context/SettingsContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Assuming NEXT_PUBLIC_API_URL is like http://localhost/api, BACKEND_STATIC_BASE_URL will be http://localhost
const BACKEND_STATIC_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_STATIC_ROOT || '';

export default function AboutPage() {
  const { getSetting, loading: settingsLoading } = useSettings();
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState('');

  useEffect(() => {
    const fetchTeamMembers = async () => {
      setTeamLoading(true);
      try {
        const resolvedApiUrl = `${API_URL}/team/`;
        console.log("[AboutPage] Attempting to fetch team from:", resolvedApiUrl);
        const res = await fetch(resolvedApiUrl);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("[AboutPage] Team fetch failed:", res.status, errorText);
          throw new Error(`Failed to fetch team members. Status: ${res.status}`);
        }
        const data = await res.json();
        console.log("[AboutPage] Successfully fetched team members:", data);
        setTeamMembers(data.sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity)));
      } catch (err) {
        console.error("[AboutPage] Error in fetchTeamMembers catch block:", err.message);
        setTeamError(err.message || 'Could not load team members.');
      }
      setTeamLoading(false);
      // Log final states after attempt
      console.log("[AboutPage] Final teamLoading state:", false);
      console.log("[AboutPage] Final teamError state:", teamError); // Note: teamError might not be updated yet here due to setState batching
      // To see the updated teamError, it's better to log it where it's used or in a subsequent effect.
      // For immediate check after set, you might need a different approach or rely on dev tools.
      // Logging teamMembers state here will show the current state value at the time of this log.
      // If setTeamMembers just ran, this log might show the previous state.
      // console.log("[AboutPage] teamMembers state after fetch attempt:", teamMembers); // This will show the value of teamMembers *before* this render's update is committed
    };
    fetchTeamMembers();
  }, []);

  const pageTitle = getSetting('about_title', 'Sobre Nosotros');
  const siteName = getSetting('site_name', 'Habitat');

  // New: Get content from settings
  const aboutMainTitle = getSetting('about_page_main_title', pageTitle); // Fallback to original pageTitle logic if specific setting not found
  const aboutMainParagraph = getSetting('about_page_main_paragraph', 'Comprometidos con encontrar tu espacio ideal.');
  const missionTitle = getSetting('about_page_mission_title', 'Nuestra Misión');
  const missionParagraph = getSetting('about_page_mission_paragraph', 'Facilitar a nuestros clientes el proceso de encontrar y adquirir la propiedad de sus sueños, ofreciendo asesoría experta, un portafolio diverso y de alta calidad, y un compromiso inquebrantable con la transparencia y la satisfacción del cliente.');
  const visionTitle = getSetting('about_page_vision_title', 'Nuestra Visión');
  const visionParagraph = getSetting('about_page_vision_paragraph', 'Ser la agencia inmobiliaria líder y más respetada en Caracas y sus alrededores, reconocida por nuestra integridad, innovación y por superar consistentemente las expectativas de quienes confían en nosotros para sus decisiones inmobiliarias más importantes.');
  const historyTitle = getSetting('about_history_title', 'Nuestra Historia'); // Assuming this might also be made dynamic
  const historyText = getSetting('about_history_text', 'Con más de una década de experiencia en el sector inmobiliario de Caracas, Habitat se ha consolidado como un referente de confianza y profesionalismo. Desde nuestros inicios, hemos trabajado con la visión de transformar la manera en que las personas encuentran y adquieren propiedades, enfocándonos en un servicio personalizado y resultados excepcionales.');
  const valuesMainTitle = getSetting('about_values_title', 'Nuestros Valores');

  if (settingsLoading || teamLoading) {
    return <div className="text-center py-10 text-gray-300">Cargando...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${pageTitle} - ${siteName}`}</title>
        <meta name="description" content={getSetting('about_description', 'Conoce más sobre nuestra empresa y equipo.')} />
      </Head>

      {/* Hero Section */}
      <section 
        className="py-20 md:py-32 bg-cover bg-center text-white relative"
        style={{ backgroundImage: `linear-gradient(rgba(var(--color-primary-rgb, 40 46 75), 0.85), rgba(var(--color-secondary-rgb, 36 44 60), 0.9)), url(${getSetting('about_hero_image_url', '/images/default-hero-bg.jpg')})` }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-down">{aboutMainTitle}</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up">
            {aboutMainParagraph}
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 bg-gray-800">
        <div className="container mx-auto px-4 space-y-12">
          {/* History Section */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-semibold text-accent mb-6">{historyTitle}</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {historyText}
            </p>
          </div>

          {/* Mission & Vision Grid */}
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="bg-gray-700 p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-semibold text-accent mb-4"><i className="fas fa-bullseye mr-2"></i> {missionTitle}</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {missionParagraph}
              </p>
            </div>
            <div className="bg-gray-700 p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-semibold text-accent mb-4"><i className="fas fa-eye mr-2"></i> {visionTitle}</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {visionParagraph}
              </p>
            </div>
          </div>

          {/* Nuestra Historia Section */}
          <div className="bg-gray-700 p-6 md:p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl md:text-3xl font-semibold text-accent mb-4">
              {settingsLoading ? 'Nuestra Historia' : getSetting('about_page_history_title', 'Nuestra Historia')}
            </h3>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
              {settingsLoading ? 'Cargando...' : getSetting('about_page_history_paragraph', 'Con más de una década de experiencia en el sector inmobiliario de Caracas, Habitat se ha consolidado como un referente de confianza y profesionalismo. Desde nuestros inicios, hemos trabajado con la visión de transformar la manera en que las personas encuentran y adquieren propiedades, enfocándonos en un servicio personalizado y resultados excepcionales.')}
            </p>
          </div>

          {/* Values Section */}
          <div>
            <h2 className="text-3xl font-semibold text-accent mb-8 text-center">{valuesMainTitle}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                getSetting(`about_value_${i}_title`) && (
                  <div key={i} className="bg-gray-700 p-6 rounded-xl shadow-lg text-center hover:shadow-accent/20 transition-shadow">
                    <i className={`fas ${getSetting(`about_value_${i}_icon`, 'fa-check-circle')} text-4xl text-accent mb-4`}></i>
                    <h4 className="text-xl font-semibold text-white mb-2">{getSetting(`about_value_${i}_title`, `Valor ${i}`)}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {getSetting(`about_value_${i}_text`, `Descripción del valor ${i}.`)}
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold text-accent mb-12 text-center">{getSetting('team_title', 'Conoce a Nuestro Equipo')}</h2>
            {teamError && <p className="text-red-500 text-center mb-4">{teamError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden text-center group transform hover:scale-105 transition-transform duration-300">
                  <div className="h-64 w-full overflow-hidden">
                    <img 
                      src={member.image_url ? (member.image_url.startsWith('http') ? member.image_url : `${BACKEND_STATIC_BASE_URL}${member.image_url}`) : '/images/placeholder-user.png'}
                      alt={member.name} 
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                    <p className="text-accent text-sm">{member.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <style jsx>{`
        .animate-fade-in-down {
          animation: fadeInDown 1s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out 0.3s both;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
} 