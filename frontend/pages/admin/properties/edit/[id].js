// Placeholder for Admin Edit Property Page
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

const API_ROOT = '/api';

const propertyTypes = ["Casa", "Apartamento", "Local Comercial", "Oficina", "Terreno", "Otro"];
const listingTypes = ["Venta de propiedad", "Renta"];

const leafletPromise = typeof window !== 'undefined' ? import('leaflet') : Promise.resolve(null);

export default function EditPropertyPage() {
  const router = useRouter();
  const { id: propertyId } = router.query;

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
    image_url: '', // Current main image URL from DB
    images: [], // Current additional images from DB {id, image_url, order}
    assigned_to_id: null, // New field
  });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(''); // For new main image selection

  const [additionalImageFiles, setAdditionalImageFiles] = useState([]); // New files to upload
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]); // Previews for new additional files
  const [imagesToDelete, setImagesToDelete] = useState([]); // IDs of existing images to delete
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('habitat_admin_token');
    if (!token || !propertyId) {
      if(!token) router.push('/admin/login');
      setLoading(false);
      return;
    }

    // Fetch current user, assignable users, and property details
    Promise.all([
      fetch(`${API_ROOT}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch current user')),
      fetch(`${API_ROOT}/users/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .catch(() => []),
      fetch(`${API_ROOT}/properties/${propertyId}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch property details'))
    ])
    .then(([userData, usersList, propertyData]) => {
      setCurrentUser(userData);
      setAssignableUsers(usersList.filter(u => u.role === 'staff' || u.role === 'manager' || u.role === 'admin'));
      
      setFormData({
        title: propertyData.title || '',
        description: propertyData.description || '',
        price: propertyData.price || '',
        location: propertyData.location || '',
        property_type: propertyData.property_type || propertyTypes[0],
        listing_type: propertyData.listing_type || listingTypes[0],
        bedrooms: propertyData.bedrooms || '',
        bathrooms: propertyData.bathrooms || '',
        area: propertyData.area || '',
        latitude: propertyData.latitude?.toString() || '10.4806',
        longitude: propertyData.longitude?.toString() || '-66.9036',
        is_featured: propertyData.is_featured || false,
        image_url: propertyData.image_url || '',
        images: propertyData.images || [],
        assigned_to_id: propertyData.assigned_to_id || null,
      });
      setMainImagePreview(propertyData.image_url || '');
      setImagesToDelete(propertyData.delete_image_ids || []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching initial data:", err);
      toast.error(err.message || "Could not load data for editing.");
      setError(err.message || "Could not load data.");
      setLoading(false);
    });

    if (typeof window !== 'undefined' && !loading && formData.latitude && formData.longitude && window.L) {
      const L = window.L;
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      if (!mapRef.current) {
        mapRef.current = L.map('leaflet-map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(mapRef.current);
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        mapRef.current.on('click', function(e) {
          const { lat: newLat, lng: newLng } = e.latlng;
          setFormData(prev => ({ ...prev, latitude: newLat.toFixed(6), longitude: newLng.toFixed(6) }));
          markerRef.current.setLatLng(e.latlng);
          mapRef.current.panTo(e.latlng);
        });
      } else {
        const newLatLng = L.latLng(lat, lng);
        mapRef.current.setView(newLatLng, mapRef.current.getZoom());
        if (markerRef.current) markerRef.current.setLatLng(newLatLng);
        else markerRef.current = L.marker(newLatLng).addTo(mapRef.current);
      }
    }
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  }, [loading, formData.latitude, formData.longitude]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : (name === 'assigned_to_id' && value === "" ? null : value) 
    }));
  };

  const handleMainImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMainImageFile(e.target.files[0]);
      setMainImagePreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setMainImageFile(null);
      setMainImagePreview(formData.image_url || ''); // Revert to original if selection cleared
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

  const handleToggleDeleteImage = (imageId) => {
    setImagesToDelete(prev => 
      prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsSubmitting(true);
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required.'); router.push('/admin/login'); setIsSubmitting(false); return;
    }

    let newMainImageUrl = formData.image_url;
    if (mainImageFile) {
      const imgFormData = new FormData(); imgFormData.append('file', mainImageFile);
      try {
        const imgRes = await fetch(`${API_ROOT}/uploads/properties`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: imgFormData });
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.detail || 'Main image upload failed');
        newMainImageUrl = imgData.url;
      } catch (err) { toast.error(`Main image upload failed: ${err.message}`); setIsSubmitting(false); return; }
    }

    const newAdditionalImageUrls = [];
    if (additionalImageFiles.length > 0) {
      for (const file of additionalImageFiles) {
        const imgFormData = new FormData(); imgFormData.append('file', file);
        try {
          const imgRes = await fetch(`${API_ROOT}/uploads/properties`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: imgFormData });
          const imgData = await imgRes.json();
          if (!imgRes.ok) throw new Error(imgData.detail || `Failed to upload ${file.name}`);
          newAdditionalImageUrls.push(imgData.url);
        } catch (err) { toast.error(`Failed to upload ${file.name}: ${err.message}`); setIsSubmitting(false); return; }
      }
    }

    const propertyDataToUpdate = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      bedrooms: formData.bedrooms !== '' ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms !== '' ? parseInt(formData.bathrooms) : null,
      area: formData.area !== '' ? parseFloat(formData.area) : null,
      latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null,
      image_url: newMainImageUrl === '' ? null : newMainImageUrl, // Convert '' to null
      additional_image_urls: newAdditionalImageUrls.length > 0 ? newAdditionalImageUrls : null,
      delete_image_ids: imagesToDelete.length > 0 ? imagesToDelete : null,
      assigned_to_id: formData.assigned_to_id ? parseInt(formData.assigned_to_id) : null,
    };
    delete propertyDataToUpdate.images; // Don't send the full images array back

    try {
      const res = await fetch(`${API_ROOT}/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(propertyDataToUpdate),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Property updated successfully!');
        router.push('/admin/properties');
      } else {
        toast.error(data.detail || 'Failed to update property.');
        setError(data.detail || 'Failed to update property.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred updating property.');
      setError('An unexpected error occurred updating property.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!propertyId) return <AdminLayout title="Edit Property"><p className="text-center text-gray-400">Loading property ID...</p></AdminLayout>;
  if (loading) return <AdminLayout title="Edit Property"><p className="text-center text-gray-400">Loading property data...</p></AdminLayout>;
  if (error && !formData.title && !loading) return <AdminLayout title="Error"><p className="text-center text-red-500">Error: {error}</p><Link href="/admin/properties" className="block text-center text-accent mt-4">Back to Properties</Link></AdminLayout>;

  return (
    <AdminLayout title={`Edit Property: ${formData.title || 'Loading...'}`}>
      <Head>
        <title>Edit Property {formData.title || propertyId} - Habitat Admin</title>
        {/* Leaflet CSS is now loaded globally via _document.js */}
      </Head>
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-accent">Edit Property</h1>
          <Link href="/admin/properties" className="text-accent hover:text-opacity-80 transition-colors">&larr; Back to Properties</Link>
        </div>
        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-6 text-center">Error: {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title *</label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full input-style" /></div>
            <div><label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Location *</label><input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="w-full input-style" /></div>
          </div>
          <div><label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description *</label><textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="4" required className="w-full input-style"></textarea></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price *</label><input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required step="0.01" min="0" className="w-full input-style" /></div>
            <div><label htmlFor="property_type" className="block text-sm font-medium text-gray-300 mb-1">Property Type *</label><select name="property_type" id="property_type" value={formData.property_type} onChange={handleChange} required className="w-full input-style h-[46px]">{propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
            <div><label htmlFor="listing_type" className="block text-sm font-medium text-gray-300 mb-1">Listing Type *</label><select name="listing_type" id="listing_type" value={formData.listing_type} onChange={handleChange} required className="w-full input-style h-[46px]">{listingTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label htmlFor="bedrooms" className="block text-sm font-medium text-gray-300 mb-1">Bedrooms</label><input type="number" name="bedrooms" id="bedrooms" value={formData.bedrooms} onChange={handleChange} min="0" className="w-full input-style" /></div>
            <div><label htmlFor="bathrooms" className="block text-sm font-medium text-gray-300 mb-1">Bathrooms</label><input type="number" name="bathrooms" id="bathrooms" value={formData.bathrooms} onChange={handleChange} min="0" className="w-full input-style" /></div>
            <div><label htmlFor="area" className="block text-sm font-medium text-gray-300 mb-1">Area (sqft)</label><input type="number" name="area" id="area" value={formData.area} onChange={handleChange} step="0.01" min="0" className="w-full input-style" /></div>
          </div>
          <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium text-gray-300 mb-2">Set Location on Map</label><div id="leaflet-map" style={{ height: '300px' }} className="rounded-md border border-gray-600 mb-2"></div><p className="text-xs text-gray-500 mt-1">Click on the map to update coordinates.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="latitude" className="block text-sm font-medium text-gray-300 mb-1">Latitude</label><input type="number" name="latitude" id="latitude" value={formData.latitude} onChange={handleChange} step="any" className="w-full input-style" /></div>
            <div><label htmlFor="longitude" className="block text-sm font-medium text-gray-300 mb-1">Longitude</label><input type="number" name="longitude" id="longitude" value={formData.longitude} onChange={handleChange} step="any" className="w-full input-style" /></div>
          </div>

          {/* Main Image Upload */}
          <div>
            <label htmlFor="mainImageFile" className="block text-sm font-medium text-gray-300 mb-1">Main Image (leave blank to keep current)</label>
            <input type="file" name="mainImageFile" id="mainImageFile" onChange={handleMainImageChange} accept="image/*" className="input-file-style" />
            {mainImagePreview && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Current/Preview Main Image:</p>
                <img src={mainImageFile ? mainImagePreview : (mainImagePreview.startsWith('blob:') ? mainImagePreview : API_ROOT + mainImagePreview) } alt="Main image preview" className="h-32 w-auto rounded object-cover" />
              </div>
            )}
          </div>

          {/* Existing Additional Images */}
          {formData.images && formData.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Current Additional Images</label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {formData.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img src={`${API_ROOT}${image.image_url}`} alt={`Additional image ${image.id}`} className={`h-24 w-full rounded object-cover ${imagesToDelete.includes(image.id) ? 'opacity-50 ring-2 ring-red-500' : ''}`}/>
                    <button 
                      type="button"
                      onClick={() => handleToggleDeleteImage(image.id)}
                      className={`absolute top-1 right-1 p-1 rounded-full text-xs ${imagesToDelete.includes(image.id) ? 'bg-red-700 text-white' : 'bg-gray-900/70 text-white hover:bg-red-600'} transition-colors`}
                      title={imagesToDelete.includes(image.id) ? 'Undo Delete' : 'Mark for Deletion'}
                    >
                      {imagesToDelete.includes(image.id) ? <i className="fas fa-undo"></i> : <i className="fas fa-trash"></i>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Additional Images Upload */}
          <div>
            <label htmlFor="additionalImageFiles" className="block text-sm font-medium text-gray-300 mb-1">Upload New Additional Images</label>
            <input type="file" name="additionalImageFiles" id="additionalImageFiles" onChange={handleAdditionalImagesChange} accept="image/*" multiple className="input-file-style" />
            {additionalImagePreviews.length > 0 && (
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                <p className="col-span-full text-xs text-gray-400 mb-1">New images to upload:</p>
                {additionalImagePreviews.map((src, index) => (
                  <img key={index} src={src} alt={`New preview ${index + 1}`} className="h-24 w-full rounded object-cover"/>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input id="is_featured" name="is_featured" type="checkbox" checked={formData.is_featured} onChange={handleChange} className="h-4 w-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent" />
            <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-300">Mark as Featured</label>
          </div>

          {/* Assignment Dropdown - visible to admin/manager */} 
          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            <div>
              <label htmlFor="assigned_to_id" className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
              <select 
                name="assigned_to_id" 
                id="assigned_to_id" 
                value={formData.assigned_to_id || ""} 
                onChange={handleChange} 
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent h-[46px]"
              >
                <option value="">Unassigned</option>
                {assignableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.username} ({user.role})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/admin/properties" className="btn-cancel">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting || loading} className="btn-submit-loading">
              {(isSubmitting || loading) && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {(isSubmitting || loading) ? 'Saving...' : 'Update Property'}
            </button>
          </div>
        </form>
      </div>
      {/* Leaflet script is now loaded globally via _app.js */}
      <style jsx>{`
        .input-style { @apply w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent; }
        .input-file-style { @apply w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-gray-900 hover:file:bg-opacity-80; }
        .btn-cancel { @apply px-6 py-2.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 transition-colors; }
        .btn-submit-loading {
          display: inline-flex; align-items: center; border: 1px solid transparent;
          font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; 
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
          color: #1f2937; background-color: var(--color-accent);
        }
        .btn-submit-loading:hover { background-color: rgba(var(--color-accent-rgb, 200 167 115), 0.8); }
        .btn-submit-loading:focus { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--color-gray-800, #1f2937), 0 0 0 4px var(--color-accent); }
        .btn-submit-loading:disabled { opacity: 0.5; }
        .btn-submit-loading svg { animation: spin 1s linear infinite; margin-left: -0.25rem; margin-right: 0.75rem; height: 1.25rem; width: 1.25rem; }
      `}</style>
    </AdminLayout>
  );
} 