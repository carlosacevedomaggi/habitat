import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import { toast } from 'react-toastify';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ROOT}/api/properties`);
      if (!res.ok) {
        throw new Error(`Failed to fetch properties: ${res.statusText}`);
      }
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load properties.');
      toast.error(err.message || 'Could not load properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDelete = async (propertyId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      router.push('/admin/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setProperties(properties.filter(p => p.id !== propertyId));
        toast.success('Property deleted successfully.');
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to delete property.'}));
        throw new Error(errorData.detail || `Failed to delete property: ${res.statusText}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Could not delete property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Manage Properties">
      <Head>
        <title>Manage Properties - Habitat Admin</title>
      </Head>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-accent">Properties</h1>
          <Link href="/admin/properties/new"
            className="bg-accent text-gray-900 hover:bg-opacity-80 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg>
            Add New Property
          </Link>
        </div>

        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">Page Error: {error}</div>}
        
        {loading && properties.length === 0 ? (
          <p className="text-gray-400 text-center">Loading properties...</p>
        ) : !loading && properties.length === 0 && !error ? (
          <p className="text-gray-400 text-center">No properties found. Add one to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-lg">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left p-4 font-semibold">ID</th>
                  <th className="text-left p-4 font-semibold">Title</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Location</th>
                  <th className="text-left p-4 font-semibold">Price</th>
                  <th className="text-left p-4 font-semibold">Featured</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr key={prop.id} className="border-b border-gray-600 hover:bg-gray-600/50 transition-colors">
                    <td className="p-4">{prop.id}</td>
                    <td className="p-4">{prop.title}</td>
                    <td className="p-4">{prop.property_type}</td>
                    <td className="p-4">{prop.location}</td>
                    <td className="p-4">${prop.price ? prop.price.toLocaleString() : 'N/A'}</td>
                    <td className="p-4">{prop.is_featured ? 'Yes' : 'No'}</td>
                    <td className="p-4 space-x-2 whitespace-nowrap">
                      <Link href={`/admin/properties/edit/${prop.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 rounded hover:bg-blue-500/20">
                        <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg> Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(prop.id)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-300 transition-colors py-1 px-2 rounded hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 