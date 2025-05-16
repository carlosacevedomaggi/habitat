import Link from 'next/link';
// import Image from 'next/image'; // Image component no longer needed here

export default function HeroSection({ /* backgroundUrl prop is no longer needed */ }) {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center text-center overflow-hidden"
    >
      {/* Background Image has been removed; this section will now show the global body background */}
      
      {/* Overlay - still useful for text contrast against the global background */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-3xl px-6 text-white">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
          Encuentra la propiedad de tus sueños
        </h1>
        <p className="text-lg md:text-2xl mb-8 drop-shadow-lg">
          Compra o alquila propiedades exclusivas en Caracas y más allá.
        </p>
        <Link
          href="/properties"
          className="inline-block bg-primary hover:bg-primary/90 transition text-white font-medium px-8 py-3 rounded-full shadow-lg"
        >
          Ver Propiedades
        </Link>
      </div>
    </section>
  );
} 