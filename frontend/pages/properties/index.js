import { useState, useMemo } from 'react';
import MapWithPins from '../../components/MapWithPins';
import { fetchProperties } from '../../services/propertyService';
import PropertySlider from '../../components/PropertySlider';
import PropertyFilter from '../../components/PropertyFilter';

export default function PropertiesPage({ properties }) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [advFilters, setAdvFilters] = useState({
    minBedrooms: '',
    maxBedrooms: '',
    minBathrooms: '',
    maxBathrooms: '',
    minArea: '',
    maxArea: '',
    minPrice: '',
    maxPrice: '',
  });

  const filtered = useMemo(() => {
    console.log('[PropertiesPage] Properties prop:', properties);
    const result = properties.filter((p) => {
      if (activeCategory !== 'Todos' && p.property_type !== activeCategory) return false;

      const numCheck = (val, min, max) => {
        if (min !== '' && val !== null && val < parseFloat(min)) return false;
        if (max !== '' && val !== null && val > parseFloat(max)) return false;
        return true;
      };

      if (!numCheck(p.bedrooms, advFilters.minBedrooms, advFilters.maxBedrooms)) return false;
      if (!numCheck(p.bathrooms, advFilters.minBathrooms, advFilters.maxBathrooms)) return false;
      if (!numCheck(p.square_feet, advFilters.minArea, advFilters.maxArea)) return false;
      if (!numCheck(p.price, advFilters.minPrice, advFilters.maxPrice)) return false;

      return true;
    });
    console.log('[PropertiesPage] Filtered properties:', result);
    return result;
  }, [properties, activeCategory, advFilters]);

  const propertiesByType = filtered.reduce((acc, prop) => {
    const key = prop.property_type || 'Otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(prop);
    return acc;
  }, {});
  console.log('[PropertiesPage] Properties by type:', propertiesByType);

  return (
    <>
      {/* Filter bar */}
      <PropertyFilter
        properties={properties}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        advFilters={advFilters}
        setAdvFilters={setAdvFilters}
      />

      {/* Map with pins (filtered) */}
      <div className="container mx-auto px-4 my-12">
        <MapWithPins properties={filtered} height="500px" />
      </div>

      {/* Category sliders */}
      <div className="container mx-auto px-4">
        {Object.entries(propertiesByType).map(([type, list]) => (
          <PropertySlider key={type} title={type} properties={list} />
        ))}
      </div>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const allProperties = await fetchProperties();
    // console.log('[getServerSideProps] All properties fetched:', allProperties?.length); // Log kept for now, can be removed later
    // No longer filtering by 'status', pass all fetched properties
    return { props: { properties: allProperties } };
  } catch (err) {
    console.error(err);
    return { props: { properties: [] } };
  }
} 