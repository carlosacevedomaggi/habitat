// Placeholder for PropertyCard Component
export default function PropertyCard({ property }) {
  // Basic structure, to be expanded
  return (
    <div className="border rounded shadow p-4">
      {/* <Image src={property.image_url} alt={property.title} width={300} height={200} /> */}
      <h3 className="text-lg font-semibold mb-1">{property?.title || 'Property Title'}</h3>
      <p className="text-sm text-gray-600">{property?.location || 'Property Location'}</p>
      <p className="text-primary font-bold">${property?.price || 'N/A'}</p>
    </div>
  );
} 