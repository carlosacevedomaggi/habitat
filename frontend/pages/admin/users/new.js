import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';

const API_ROOT = '/api';

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    is_admin: false,
    is_editor: true, // Default to editor
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required. Please login.');
      router.push('/admin/login');
      setLoading(false);
      return;
    }

    if (!formData.password) {
        toast.error('Password is required for new users.');
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`${API_ROOT}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('User created successfully!');
        router.push('/admin/users');
      } else {
        toast.error(data.detail || 'Failed to create user.');
        setError(data.detail || 'Failed to create user.');
      }
    } catch (err) {
      console.error('User creation error:', err);
      toast.error('An unexpected error occurred creating the user.');
      setError('An unexpected error occurred creating the user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add New User">
      <Head>
        <title>Add New User - Habitat Admin</title>
      </Head>
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-accent">Add New User</h1>
          <Link href="/admin/users" className="text-accent hover:text-opacity-80 transition-colors">
            &larr; Back to Users
          </Link>
        </div>

        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-6 text-center">Error: {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username *</label>
            <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="w-full input-style" />
          </div>
          
          <fieldset className="pt-4">
            <legend className="text-sm font-medium text-gray-300 mb-2">Roles</legend>
            <div className="space-y-3">
              <div className="flex items-center">
                <input id="is_admin" name="is_admin" type="checkbox" checked={formData.is_admin} onChange={handleChange} className="h-4 w-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent" />
                <label htmlFor="is_admin" className="ml-3 block text-sm text-gray-300">Administrator</label>
              </div>
              <div className="flex items-center">
                <input id="is_editor" name="is_editor" type="checkbox" checked={formData.is_editor} onChange={handleChange} className="h-4 w-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent" />
                <label htmlFor="is_editor" className="ml-3 block text-sm text-gray-300">Editor</label>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/admin/users" className="btn-cancel">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn-submit-loading">
              {loading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .input-style { @apply w-full bg-theme-background-secondary text-theme-text-on-dark border-theme-border rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent; }
        .btn-cancel { @apply px-6 py-2.5 border border-theme-border text-sm font-medium rounded-md text-theme-text-on-dark hover:bg-theme-background-secondary transition-colors; }
        .btn-submit-loading {
          display: inline-flex; align-items: center; border: 1px solid transparent;
          font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; 
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