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
      {/* Leaflet JS is now included in the main bundle as it's a direct dependency.
          The <Script> tag has been removed to avoid SRI issues and rely on the npm package.
          Leaflet CSS is imported at the top of this file. */}
    </SettingsProvider>
  );
}

export default MyApp; 