import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';

const API_ROOT = '/api';

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    order: 0, // Default order, could be auto-incremented or managed differently
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setImagePreview('');
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

    let uploadedImageUrl = null;
    if (imageFile) {
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      try {
        const imgRes = await fetch(`${API_ROOT}/uploads/team`, { // Use 'team' upload_type
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

    const memberData = {
      ...formData,
      order: parseInt(formData.order) || 0,
      image_url: uploadedImageUrl,
    };

    try {
      const res = await fetch(`${API_ROOT}/team/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(memberData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Team member created successfully!');
        router.push('/admin/team');
      } else {
        toast.error(data.detail || 'Failed to create team member.');
        setError(data.detail || 'Failed to create team member.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred creating the team member.');
      setError('An unexpected error occurred creating the team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Add New Team Member">
      <Head>
        <title>Add New Team Member - Habitat Admin</title>
      </Head>
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-accent">Add New Team Member</h1>
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
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-300 mb-1">Photo</label>
            <input type="file" name="imageFile" id="imageFile" onChange={handleFileChange} accept="image/*" className="input-file-style" />
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-auto rounded object-cover"/>}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/admin/team" className="btn-cancel">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn-submit-loading">
              {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isSubmitting ? 'Saving...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .input-style { @apply w-full bg-theme-background-secondary text-theme-text-on-dark border-theme-border rounded-md shadow-sm p-2.5 focus:ring-accent focus:border-accent; }
        .input-file-style { @apply w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-theme-text-on-dark hover:file:bg-opacity-80; }
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