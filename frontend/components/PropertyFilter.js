import { useEffect, useState } from 'react';

export default function PropertyFilter({ properties = [], activeCategory, setActiveCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Derive categories from properties (property_type). Fallback to 'Otros'.
    const cats = new Set();
    properties.forEach((p) => {
      if (p.property_type) cats.add(p.property_type);
    });
    setCategories(['Todos', ...Array.from(cats)]);
  }, [properties]);

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-8 px-4">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={`px-4 py-2 rounded-full border transition-colors text-sm md:text-base ${
            activeCategory === cat
              ? 'bg-accent text-gray-900 border-accent'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
} 