import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import { toast } from 'react-toastify';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  // const [currentUser, setCurrentUser] = useState(null); // To prevent deleting self

  // Fetch current user details (optional, for disabling delete self)
  // useEffect(() => {
  //   const token = localStorage.getItem('habitat_admin_token');
  //   if (token) {
  //     fetch(`${API_ROOT}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } })
  //       .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch current user'))
  //       .then(data => setCurrentUser(data))
  //       .catch(console.error);
  //   }
  // }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required.');
      router.push('/admin/login');
      return;
    }
    try {
      const res = await fetch(`${API_ROOT}/api/users/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Failed to fetch users: ${res.statusText}`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load users.');
      toast.error(err.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (userId) => {
    // if (currentUser && userId === currentUser.id) {
    //   toast.error("You cannot delete your own account.");
    //   return;
    // }
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication token not found.');
      router.push('/admin/login');
      return;
    }
    
    const originalUsers = [...users];
    const updatedUsers = users.map(u => u.id === userId ? {...u, isDeleting: true} : u);
    setUsers(updatedUsers);

    try {
      const res = await fetch(`${API_ROOT}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('User deleted successfully.');
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId)); 
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to delete user.'}));
        setUsers(originalUsers); // Revert optimistic update
        throw new Error(errorData.detail || `Failed to delete user: ${res.statusText}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Could not delete user.');
      setUsers(originalUsers.map(u => ({...u, isDeleting: false }))); // Revert and reset deleting state
    } 
    // No finally setLoading(false) here if we are handling per-row loading state for delete.
  };

  return (
    <AdminLayout title="Manage Users">
      <Head>
        <title>Manage Users - Habitat Admin</title>
      </Head>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-accent">Users</h1>
          <Link href="/admin/users/new"
            className="bg-accent text-gray-900 hover:bg-opacity-80 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg>
            Add New User
          </Link>
        </div>

        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">Page Error: {error}</div>}
        
        {loading && users.length === 0 ? (
          <p className="text-gray-400 text-center">Loading users...</p>
        ) : !loading && users.length === 0 && !error ? (
          <p className="text-gray-400 text-center">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-lg">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left p-4 font-semibold">ID</th>
                  <th className="text-left p-4 font-semibold">Username</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Admin</th>
                  <th className="text-left p-4 font-semibold">Editor</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-600 hover:bg-gray-600/50 transition-colors">
                    <td className="p-4">{user.id}</td>
                    <td className="p-4">{user.username}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.role === 'admin' ? <span className="px-2 py-1 text-xs font-semibold text-green-100 bg-green-600 rounded-full">Yes</span> : <span className="px-2 py-1 text-xs font-semibold text-red-100 bg-red-600 rounded-full">No</span>}</td>
                    <td className="p-4">{user.role === 'manager' ? <span className="px-2 py-1 text-xs font-semibold text-green-100 bg-green-600 rounded-full">Yes</span> : <span className="px-2 py-1 text-xs font-semibold text-red-100 bg-red-600 rounded-full">No</span>}</td>
                    <td className="p-4 space-x-2 whitespace-nowrap">
                      <Link href={`/admin/users/edit/${user.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 rounded hover:bg-blue-500/20">
                        <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg> Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        disabled={user.isDeleting || loading} 
                        className="text-red-400 hover:text-red-300 transition-colors py-1 px-2 rounded hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg> Delete
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