import { useState } from 'react';

// Placeholder for ImageCarousel Component
export default function ImageCarousel({ images, imageClassName = 'w-full h-64 md:h-96 object-cover' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="flex items-center justify-center h-64 bg-gray-700 text-gray-400 rounded-lg">No images available</div>;
  }

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  const currentImage = images[currentIndex];
  // Ensure currentImage is an object with an image_url or url property
  const imageUrl = typeof currentImage === 'string' ? currentImage : (currentImage?.image_url || currentImage?.url || '');
  const imageAlt = typeof currentImage === 'string' ? `Slide ${currentIndex + 1}` : (currentImage?.alt || `Property image ${currentIndex + 1}`);

  return (
    <div className="relative w-full select-none overflow-hidden rounded-lg shadow-lg bg-gray-800">
      <div className="aspect-[16/9] md:aspect-[2/1]">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} className={`${imageClassName} transition-opacity duration-500 ease-in-out`} key={currentIndex}/>
        ) : (
          <div className={`flex items-center justify-center text-gray-400 ${imageClassName}`}>Image not found</div>
        )}
      </div>
      
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <button 
            onClick={goToPrevious} 
            className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 focus:outline-none transition-colors z-10"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          {/* Right Arrow */}
          <button 
            onClick={goToNext} 
            className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 focus:outline-none transition-colors z-10"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>

          {/* Dots Navigation */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {images.map((_, slideIndex) => (
              <button
                key={slideIndex}
                onClick={() => goToSlide(slideIndex)}
                className={`w-3 h-3 rounded-full transition-colors ${currentIndex === slideIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                aria-label={`Go to slide ${slideIndex + 1}`}
              ></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 