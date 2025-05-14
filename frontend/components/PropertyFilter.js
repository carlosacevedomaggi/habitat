import { useEffect, useState } from 'react';

export default function PropertyFilter({ properties = [], activeCategory, setActiveCategory, advFilters, setAdvFilters }) {
  const [categories, setCategories] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Derive categories from properties (property_type). Fallback to 'Otros'.
    const cats = new Set();
    properties.forEach((p) => {
      if (p.property_type && p.property_type !== 'Galpón') cats.add(p.property_type);
    });
    setCategories(['Todos', ...Array.from(cats)]);
  }, [properties]);

  const handleAdvChange = (e) => {
    const { name, value } = e.target;
    setAdvFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 mb-8">
      {/* Category buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full border transition-colors text-sm md:text-base ${
              activeCategory === cat ? 'bg-accent text-gray-900 border-accent' : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Toggle advanced */}
      <div className="flex justify-center mb-2">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors focus:outline-none">
          {showAdvanced ? 'Ocultar filtros avanzados' : 'Filtros avanzados'}
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Advanced numeric filters */}
      <div className={`overflow-hidden transition-all duration-500 ${showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 text-sm">
          {/* Bedrooms */}
          <input type="number" min="0" placeholder="Min Habit." name="minBedrooms" value={advFilters.minBedrooms} onChange={handleAdvChange} className="input-num" />
          <input type="number" min="0" placeholder="Max Habit." name="maxBedrooms" value={advFilters.maxBedrooms} onChange={handleAdvChange} className="input-num" />

          {/* Bathrooms */}
          <input type="number" min="0" placeholder="Min Baños" name="minBathrooms" value={advFilters.minBathrooms} onChange={handleAdvChange} className="input-num" />
          <input type="number" min="0" placeholder="Max Baños" name="maxBathrooms" value={advFilters.maxBathrooms} onChange={handleAdvChange} className="input-num" />

          {/* Area */}
          <input type="number" min="0" placeholder="Min m²" name="minArea" value={advFilters.minArea} onChange={handleAdvChange} className="input-num" />
          <input type="number" min="0" placeholder="Max m²" name="maxArea" value={advFilters.maxArea} onChange={handleAdvChange} className="input-num" />

          {/* Price */}
          <input type="number" min="0" placeholder="Min Precio" name="minPrice" value={advFilters.minPrice} onChange={handleAdvChange} className="input-num" />
          <input type="number" min="0" placeholder="Max Precio" name="maxPrice" value={advFilters.maxPrice} onChange={handleAdvChange} className="input-num" />
        </div>
      </div>

      <style jsx>{`
        /* .input-num styling is now covered by global input,textarea,select rule */
      `}</style>
    </div>
  );
} 