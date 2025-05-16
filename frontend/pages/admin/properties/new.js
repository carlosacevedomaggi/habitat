import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const propertyTypes = ["Casa", "Apartamento", "Local Comercial", "Oficina", "Terreno", "Otro"];
const listingTypes = ["Venta de propiedad", "Renta"];

// Lazy-load Leaflet only on client to prevent SSR issues
const leafletPromise = typeof window !== 'undefined' ? import('leaflet') : Promise.resolve(null);

export default function NewPropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    property_type: propertyTypes[0],
    listing_type: listingTypes[0],
    bedrooms: '',
    bathrooms: '',
    area: '',
    latitude: '10.4806',
    longitude: '-66.9036',
    is_featured: false,
  });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      leafletPromise.then((module) => {
        const L = module?.default ?? window.L;
        if (!L) return;
        const container = document.getElementById('leaflet-map');
        if (!container) return;
        const initialLat = parseFloat(formData.latitude) || 10.4806;
        const initialLng = parseFloat(formData.longitude) || -66.9036;
        if (container._leaflet_id) {
          // Remove old id so Leaflet can init again (hot reload)
          container._leaflet_id = null;
        }
        const map = L.map(container).setView([initialLat, initialLng], 13);
        mapRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
        map.on('click', function(e) {
          const { lat, lng } = e.latlng;
          setFormData(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
          markerRef.current.setLatLng(e.latlng);
          mapRef.current.panTo(e.latlng);
        });
      });
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (mapRef.current && markerRef.current && window.L) {
        const L = window.L;
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            const newLatLng = L.latLng(lat, lng);
            markerRef.current.setLatLng(newLatLng);
            mapRef.current.panTo(newLatLng);
        }
    }
  }, [formData.latitude, formData.longitude]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMainImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMainImageFile(e.target.files[0]);
      setMainImagePreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setMainImageFile(null);
      setMainImagePreview('');
    }
  };

  const handleAdditionalImagesChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAdditionalImageFiles(filesArray);
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setAdditionalImagePreviews(previews);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setIsSubmitting(true);
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required. Please login.');
      router.push('/admin/login');
      setIsSubmitting(false);
      return;
    }

    let mainImageUrl = '';
    if (mainImageFile) {
      const imageFormData = new FormData();
      imageFormData.append('file', mainImageFile);
      try {
        const imgRes = await fetch(`${API_ROOT}/api/uploads/properties`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: imageFormData,
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.detail || 'Main image upload failed');
        mainImageUrl = imgData.url;
      } catch (err) {
        toast.error(`Main image upload failed: ${err.message}`);
        setIsSubmitting(false); return;
      }
    }

    const uploadedAdditionalImageUrls = [];
    if (additionalImageFiles.length > 0) {
      for (const file of additionalImageFiles) {
        const imageFormData = new FormData();
        imageFormData.append('file', file);
        try {
          const imgRes = await fetch(`${API_ROOT}/api/uploads/properties`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: imageFormData,
          });
          const imgData = await imgRes.json();
          if (!imgRes.ok) throw new Error(imgData.detail || `Failed to upload ${file.name}`);
          uploadedAdditionalImageUrls.push(imgData.url);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${err.message}`); 
          setIsSubmitting(false); return;
        }
      }
    }

    const propertyData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      area: formData.area ? parseFloat(formData.area) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      image_url: mainImageUrl || null,
      additional_image_urls: uploadedAdditionalImageUrls.length > 0 ? uploadedAdditionalImageUrls : null,
    };

    try {
      const res = await fetch(`${API_ROOT}/api/properties/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(propertyData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Property created successfully!');
        router.push('/admin/properties');
      } else {
        toast.error(data.detail || 'Failed to create property.');
        setError(data.detail || 'Failed to create property.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred creating the property.');
      setError('An unexpected error occurred creating the property.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Add New Property">
      <Head>
        <title>Add New Property - Habitat Admin</title>
        {/* Leaflet CSS is now loaded globally via _document.js */}
      </Head>
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-accent">Add New Property</h1>
          <Link href="/admin/properties" className="text-accent hover:text-opacity-80 transition-colors">
            &larr; Back to Properties
          </Link>
        </div>
        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-6 text-center">Error: {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
              <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Location *</label>
              <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="4" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price *</label>
              <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required step="0.01" min="0" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
            <div>
              <label htmlFor="property_type" className="block text-sm font-medium text-gray-300 mb-1">Property Type *</label>
              <select name="property_type" id="property_type" value={formData.property_type} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent h-[46px]">
                {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="listing_type" className="block text-sm font-medium text-gray-300 mb-1">Listing Type *</label>
              <select name="listing_type" id="listing_type" value={formData.listing_type} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent h-[46px]">
                {listingTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-300 mb-1">Bedrooms</label>
              <input type="number" name="bedrooms" id="bedrooms" value={formData.bedrooms} onChange={handleChange} min="0" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-300 mb-1">Bathrooms</label>
              <input type="number" name="bathrooms" id="bathrooms" value={formData.bathrooms} onChange={handleChange} min="0" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-300 mb-1">Area (sqft)</label>
              <input type="number" name="area" id="area" value={formData.area} onChange={handleChange} step="0.01" min="0" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Set Location on Map</label>
            <div id="leaflet-map" style={{ height: '300px' }} className="rounded-md border border-gray-600 mb-2"></div>
            <p className="text-xs text-gray-500 mt-1">Click on the map to set coordinates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-300 mb-1">Latitude</label>
              <input type="number" name="latitude" id="latitude" value={formData.latitude} onChange={handleChange} step="any" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-300 mb-1">Longitude</label>
              <input type="number" name="longitude" id="longitude" value={formData.longitude} onChange={handleChange} step="any" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent" />
            </div>
          </div>

          <div>
            <label htmlFor="mainImageFile" className="block text-sm font-medium text-gray-300 mb-1">Main Image</label>
            <input type="file" name="mainImageFile" id="mainImageFile" onChange={handleMainImageChange} accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-gray-900 hover:file:bg-opacity-80" />
            {mainImagePreview && <img src={mainImagePreview} alt="Main image preview" className="mt-2 h-32 w-auto rounded object-cover"/>}
          </div>

          <div>
            <label htmlFor="additionalImageFiles" className="block text-sm font-medium text-gray-300 mb-1">Additional Images (Up to 5)</label>
            <input type="file" name="additionalImageFiles" id="additionalImageFiles" onChange={handleAdditionalImagesChange} accept="image/*" multiple className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-gray-900 hover:file:bg-opacity-80" />
            {additionalImagePreviews.length > 0 && (
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {additionalImagePreviews.map((src, index) => (
                  <img key={index} src={src} alt={`Preview ${index + 1}`} className="h-24 w-full rounded object-cover"/>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input id="is_featured" name="is_featured" type="checkbox" checked={formData.is_featured} onChange={handleChange} className="h-4 w-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent" />
            <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-300">Mark as Featured</label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/admin/properties"
              className="px-6 py-2.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn-submit-loading">
              {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isSubmitting ? 'Saving...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
      {/* Leaflet script is now loaded globally via _app.js */}
      <style jsx>{`
        .input-style { @apply w-full bg-theme-background-secondary text-theme-text-on-dark border-theme-border rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent; }
        .btn-cancel { @apply px-6 py-2.5 border border-theme-border text-sm font-medium rounded-md text-theme-text-on-dark hover:bg-theme-background-secondary transition-colors; }
        .btn-submit-loading {
          display: inline-flex; align-items: center; border: 1px solid transparent;
          font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; 
          padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 0.625rem; padding-bottom: 0.625rem; 
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
          color: var(--color-text-on-dark);
          background-color: var(--color-accent);
        }
        .btn-submit-loading:hover { background-color: var(--color-primary-dark); }
        .btn-submit-loading:focus { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--color-background-secondary), 0 0 0 4px var(--color-accent); }
        .btn-submit-loading:disabled { opacity: 0.5; }
        .btn-submit-loading svg { animation: spin 1s linear infinite; margin-left: -0.25rem; margin-right: 0.75rem; height: 1.25rem; width: 1.25rem; }
      `}</style>
    </AdminLayout>
  );
} 