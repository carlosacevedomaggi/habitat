// Placeholder for Admin Edit Team Member Page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';

const API_ROOT = '/api';

export default function EditTeamMemberPage() {
  const router = useRouter();
  const { id: memberId } = router.query;

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    order: 0,
    image_url: '', // For storing current image URL
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(''); // For new image selection or existing image
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    const token = localStorage.getItem('habitat_admin_token');
    // GET /api/team/:id is public, but good to be consistent for admin context

    fetch(`${API_ROOT}/team/${memberId}`, { 
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch team member details');
        return res.json();
      })
      .then(data => {
        setFormData({
          name: data.name || '',
          position: data.position || '',
          order: data.order === null || data.order === undefined ? 0 : data.order,
          image_url: data.image_url || '', 
        });
        setImagePreview(data.image_url || '');
      })
      .catch(err => {
        toast.error(err.message || 'Could not load team member data.');
        setError(err.message || 'Could not load team member data.');
      })
      .finally(() => setLoading(false));
  }, [memberId, router]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (parseInt(value) || 0) : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setImageFile(null);
      setImagePreview(formData.image_url || ''); // Revert to original if selection cleared
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

    let uploadedImageUrl = formData.image_url; // Keep current if no new file

    if (imageFile) {
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      try {
        const imgRes = await fetch(`${API_ROOT}/uploads/team`, { // Ensure this is 'team'
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imageFormData,
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.detail || 'Image upload failed');
        uploadedImageUrl = imgData.url;
      } catch (err) {
        toast.error(`Image upload failed: ${err.message}`);
        setIsSubmitting(false);
        return;
      }
    }

    const memberDataToUpdate = {
      ...formData,
      order: parseInt(formData.order) || 0,
      image_url: uploadedImageUrl === '' ? null : uploadedImageUrl, 
    };

    try {
      const res = await fetch(`${API_ROOT}/team/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(memberDataToUpdate),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Team member updated successfully!');
        router.push('/admin/team');
      } else {
        toast.error(data.detail || 'Failed to update team member.');
        setError(data.detail || 'Failed to update team member.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred updating the team member.');
      setError('An unexpected error occurred updating the team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!memberId) return <AdminLayout title="Edit Team Member"><p className="text-center text-gray-400">Loading member ID...</p></AdminLayout>;
  if (loading) return <AdminLayout title="Edit Team Member"><p className="text-center text-gray-400">Loading member data...</p></AdminLayout>;
  if (error && !formData.name && !loading) return <AdminLayout title="Error"><p className="text-center text-red-500">Error: {error}</p><Link href="/admin/team" className="block text-center text-accent mt-4">Back to Team List</Link></AdminLayout>;

  return (
    <AdminLayout title={`Edit Member: ${formData.name || ''}`}>
      <Head>
        <title>Edit Team Member {formData.name || memberId} - Habitat Admin</title>
      </Head>
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-accent">Edit Team Member</h1>
          <Link href="/admin/team" className="text-accent hover:text-opacity-80 transition-colors">
            &larr; Back to Team List
          </Link>
        </div>

        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-6 text-center">Error: {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-1">Position *</label>
            <input type="text" name="position" id="position" value={formData.position} onChange={handleChange} required className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
            <input type="number" name="order" id="order" value={formData.order} onChange={handleChange} min="0" className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-300 mb-1">Photo (leave blank to keep current)</label>
            <input type="file" name="imageFile" id="imageFile" onChange={handleFileChange} accept="image/*" className="input-file-style" />
            {imagePreview && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Current/Preview:</p>
                <img src={imagePreview} alt="Team member photo" className="h-32 w-auto rounded object-cover" />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/admin/team" className="btn-cancel">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting || loading} className="btn-submit-loading">
              {(isSubmitting || loading) && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {(isSubmitting || loading) ? 'Saving...' : 'Update Member'}
            </button>
          </div>
        </form>
      </div>
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