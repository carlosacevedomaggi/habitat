import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import { toast } from 'react-toastify';

const API_ROOT = '/api';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [isAssigning, setIsAssigning] = useState({});

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required. Please log in.');
      router.push('/admin/login');
      setLoading(false);
      return;
    }

    try {
      const userRes = await fetch(`${API_ROOT}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userRes.ok) throw new Error('Failed to fetch current user details');
      const userData = await userRes.json();
      setCurrentUser(userData);

      if (userData.role === 'admin' || userData.role === 'manager') {
        const usersListRes = await fetch(`${API_ROOT}/users/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!usersListRes.ok) throw new Error('Failed to fetch users for assignment');
        const usersList = await usersListRes.json();
        setAssignableUsers(usersList.filter(u => u.role === 'staff' || u.role === 'manager' || u.role === 'admin'));
      } else {
        setAssignableUsers([]);
      }

      await fetchProperties(token);

    } catch (err) {
      console.error("Error in initial data fetch:", err);
      const errorMessage = typeof err === 'string' ? err : (err.message || "Could not load page data.");
      setError(errorMessage);
      toast.error(errorMessage);
      if (errorMessage.includes('user') || errorMessage.includes('Authentication')) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProperties = async (token) => {
    setError('');
    if (!token) {
      token = localStorage.getItem('habitat_admin_token');
      if (!token) {
        toast.error('Authentication required for fetching properties.');
        router.push('/admin/login');
        return;
      }
    }
    try {
      const res = await fetch(`${API_ROOT}/properties/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch properties: ${res.statusText}`);
      }
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load properties.');
      toast.error(err.message || 'Could not load properties.');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAssignProperty = async (propertyId, assignedToId) => {
    setIsAssigning(prev => ({...prev, [propertyId]: true }));
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required.');
      setIsAssigning(prev => ({...prev, [propertyId]: false }));
      router.push('/admin/login');
      return;
    }

    try {
      const res = await fetch(`${API_ROOT}/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assigned_to_id: assignedToId === "" ? null : parseInt(assignedToId) })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({detail: "Failed to assign property"}));
        throw new Error(errData.detail);
      }
      toast.success('Property assignment updated.');
      await fetchProperties(token);
    } catch (err) {
      toast.error(err.message || "Could not update assignment.");
      console.error("Assignment error:", err);
    } finally {
      setIsAssigning(prev => ({...prev, [propertyId]: false }));
    }
  };

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
      const res = await fetch(`${API_ROOT}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success('Property deleted successfully.');
        const token = localStorage.getItem('habitat_admin_token');
        if (token) await fetchProperties(token);
        else router.push('/admin/login');
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
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No properties found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new property.</p>
            <div className="mt-6">
              <Link href="/admin/properties/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-900 bg-accent hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-accent">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg>
                New Property
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <div 
                key={prop.id} 
                className="bg-gray-700 rounded-lg shadow-lg overflow-hidden flex flex-col justify-between group relative"
              >
                <div className="p-5 cursor-pointer" onClick={() => router.push(`/admin/properties/edit/${prop.id}`)}>
                  {/* Placeholder for Picture */}
                  <div className="w-full h-48 bg-gray-600 mb-4 rounded-md flex items-center justify-center text-gray-400">
                    {prop.image_url ? (
                        <img src={prop.image_url} alt={prop.title} className="w-full h-full object-cover"/>
                    ) : (
                        <span>No Image</span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-accent mb-2 truncate group-hover:text-blue-300 transition-colors" title={prop.title}>{prop.title}</h2>
                  <p className="text-gray-400 text-sm mb-1">Type: {prop.property_type}</p>
                  <p className="text-gray-400 text-sm mb-1 truncate">Location: {prop.location}</p>
                  <p className="text-gray-300 text-lg font-bold mb-3">${prop.price ? prop.price.toLocaleString() : 'N/A'}</p>
                  {prop.is_featured && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>

                {/* Hover Popup Content - hidden by default, shown on group hover */}
                <div className="absolute inset-0 bg-black bg-opacity-70 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center">
                  <p className="text-gray-200 text-sm">
                    Created: {new Date(prop.created_at).toLocaleDateString()} at {new Date(prop.created_at).toLocaleTimeString()}
                  </p>
                  {prop.updated_at && prop.updated_at !== prop.created_at && (
                    <p className="text-gray-200 text-sm mt-1">
                      Updated: {new Date(prop.updated_at).toLocaleDateString()} at {new Date(prop.updated_at).toLocaleTimeString()}
                    </p>
                  )}
                  <p className="text-gray-200 text-sm mt-1">By: {prop.created_by?.username || 'N/A'}</p>
                  <p className="text-gray-200 text-sm mt-1">Clicks: {prop.clicks?.length ?? 0}</p>
                  <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/properties/edit/${prop.id}`); }}
                      className="mt-4 text-blue-400 hover:text-blue-300 transition-colors py-1 px-3 rounded bg-gray-800 hover:bg-gray-700 text-sm"
                  >
                      Edit Property
                  </button>
                </div>

                <div className="p-5 border-t border-gray-600">
                  {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                    <div className="mb-3">
                      <label htmlFor={`assign-${prop.id}`} className="block text-xs font-medium text-gray-400 mb-1">Assign To:</label>
                      <select 
                        id={`assign-${prop.id}`}
                        value={prop.assigned_to_id || ""} 
                        onChange={(e) => { e.stopPropagation(); handleAssignProperty(prop.id, e.target.value);}}
                        onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with select
                        disabled={isAssigning[prop.id]}
                        className="bg-gray-600 border border-gray-500 text-white text-sm rounded p-2 focus:ring-accent focus:border-accent disabled:opacity-50 w-full"
                      >
                        <option value="">Unassigned</option>
                        {assignableUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.username} ({user.role})</option>
                        ))}
                      </select>
                      {isAssigning[prop.id] && <span className='text-xs ml-1 text-gray-400'>Updating...</span>}
                    </div>
                  )}
                  {!(currentUser?.role === 'admin' || currentUser?.role === 'manager') && prop.assigned_to && (
                     <p className="text-sm text-gray-400 mb-2">Assigned to: {prop.assigned_to.username}</p>
                  )}
                  <p className="text-xs text-gray-500">Created by: {prop.created_by?.username || 'N/A'}</p>
                   <p className="text-xs text-gray-500">
                        Created: {new Date(prop.created_at).toLocaleDateString()}
                        {prop.updated_at && prop.updated_at !== prop.created_at ? 
                           ` (Updated: ${new Date(prop.updated_at).toLocaleDateString()})` : ''}
                   </p>
                </div>
                
                {/* Delete Button - Top Right of Card */}
                {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && ( // Only show delete for admin/manager
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(prop.id); }}
                        disabled={loading} // Consider a specific deleting state if needed, e.g., isDeleting[prop.id]
                        title="Delete Property"
                        className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50 z-10" // z-10 to be above featured badge
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    </button>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 