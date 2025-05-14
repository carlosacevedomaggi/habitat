// Placeholder for Layout Component
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        {/* Font Awesome is now in _document.js */}
        {/* You can keep other per-page Head elements here if needed */}
      </Head>
      <div className="flex flex-col min-h-screen bg-background text-text font-primary">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
} 