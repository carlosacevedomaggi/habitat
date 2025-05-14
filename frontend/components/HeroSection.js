import Link from 'next/link';

export default function HeroSection({ backgroundUrl }) {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center text-center"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl px-6 text-white">
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