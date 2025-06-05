import '../styles/globals.css';
import { SettingsProvider } from '../context/SettingsContext';
import Layout from '../components/Layout'; // Assuming Layout is your main layout component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Script from 'next/script'; // Import Next.js Script component
import 'leaflet/dist/leaflet.css';
import 'swiper/css';
import 'swiper/css/navigation';

function MyApp({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <Layout>
        <Component {...pageProps} />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored" // Or "light", "dark"
        />
      </Layout>
      {/* Load Leaflet JS globally */}
      <Script 
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin="anonymous"
        strategy="beforeInteractive" // Load before page becomes interactive
      />
    </SettingsProvider>
  );
}

export default MyApp; 