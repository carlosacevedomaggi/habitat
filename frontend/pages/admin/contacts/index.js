import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import Link from 'next/link';
import Head from 'next/head';
import { toast } from 'react-toastify';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    fetch(`${API_ROOT}/api/contact/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load submissions');
        return res.json();
      })
      .then(setSubmissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async (submissionId) => {
    setPdfLoading(prev => ({ ...prev, [submissionId]: true }));
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required to download PDF.');
      setPdfLoading(prev => ({ ...prev, [submissionId]: false }));
      return;
    }

    try {
      const res = await fetch(`${API_ROOT}/api/contact/${submissionId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to download PDF.'}));
        throw new Error(errorData.detail || 'Could not download PDF.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contact_submission_${submissionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully.');

    } catch (err) {
      console.error('PDF download error:', err);
      toast.error(err.message || 'Failed to download PDF.');
    } finally {
      setPdfLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  return (
    <AdminLayout title="Contact Submissions">
      <Head>
        <title>Contact Submissions - Habitat Admin</title>
      </Head>
      <h1 className="text-3xl font-semibold text-accent mb-6">Contact Submissions</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow divide-y divide-gray-700">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-4 py-2">{s.id}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2 truncate max-w-xs">{s.subject}</td>
                  <td className="px-4 py-2">{new Date(s.submitted_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadPdf(s.id)}
                      disabled={pdfLoading[s.id]}
                      className="text-accent underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pdfLoading[s.id] ? 'Downloading...' : 'PDF'}
                    </button>
                    <button
                      onClick={() => handleSendEmail(s.id)}
                      className="text-blue-400 hover:text-blue-500 text-sm"
                    >Send Email</button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-400 hover:text-red-500 text-sm"
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );

  function handleSendEmail(id) {
    const email = prompt('¿A qué correo deseas enviar este formulario? (Deja vacío para usar el correo por defecto)');
    if (email === null) return; // cancelled
    const token = localStorage.getItem('habitat_admin_token');
    fetch(`${API_ROOT}/api/contact/${id}/send-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_email: email }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'No se pudo enviar el correo');
        }
        alert('¡Correo enviado!');
      })
      .catch((err) => alert(err.message));
  }

  function handleDelete(id) {
    if (!confirm('Delete this submission?')) return;
    const token = localStorage.getItem('habitat_admin_token');
    fetch(`${API_ROOT}/api/contact/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete');
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      })
      .catch((err) => alert(err.message));
  }
} 