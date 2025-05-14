import { useState } from 'react';
import MapWithPins from '../../components/MapWithPins';
import { fetchProperties } from '../../services/propertyService';
import PropertySlider from '../../components/PropertySlider';
import PropertyFilter from '../../components/PropertyFilter';

export default function PropertiesPage({ properties }) {
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Filter properties based on selected category
  const filtered =
    activeCategory === 'Todos'
      ? properties
      : properties.filter((p) => p.property_type === activeCategory);

  const propertiesByType = filtered.reduce((acc, prop) => {
    const key = prop.property_type || 'Otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(prop);
    return acc;
  }, {});

  return (
    <>
      {/* Filter bar */}
      <PropertyFilter
        properties={properties}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
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
    const properties = await fetchProperties();
    return { props: { properties } };
  } catch (err) {
    console.error(err);
    return { props: { properties: [] } };
  }
} 