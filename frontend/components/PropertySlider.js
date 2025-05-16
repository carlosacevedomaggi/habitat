import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';

export default function PropertySlider({ title, properties }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  if (!properties || properties.length === 0) return null;

  return (
    <section className="my-12">
      {title && <h2 className="text-2xl font-semibold mb-4 px-2">{title}</h2>}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          ref={prevRef}
          className="absolute z-10 left-0 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full hidden md:inline-flex"
        >
          ◀
        </button>
        <button
          ref={nextRef}
          className="absolute z-10 right-0 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full hidden md:inline-flex"
        >
          ▶
        </button>

        <Swiper
          modules={[Navigation]}
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onBeforeInit={(swiper) => {
            // eslint-disable-next-line no-param-reassign
            swiper.params.navigation.prevEl = prevRef.current;
            // eslint-disable-next-line no-param-reassign
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          slidesPerView={1.2}
          spaceBetween={12}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.2 },
          }}
        >
          {properties.map((prop) => (
            <SwiperSlide key={prop.id}>
              <Link href={`/properties/${prop.id}`} className="block group bg-white rounded-lg shadow overflow-hidden">
                <div className="flex h-48">
                  {/* Left half - image (takes 50%) */}
                  <div className="relative w-1/2">
                    <Image
                      src={prop.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={prop.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* Right half - details */}
                  <div className="w-1/2 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{prop.title}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{prop.location}</p>
                    </div>
                    <div>
                      <p className="text-primary font-bold text-sm mb-1">${prop.price?.toLocaleString() || '—'}</p>
                      <p className="text-xs text-gray-600">{prop.square_feet ? `${prop.square_feet} m²` : ''}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
} 