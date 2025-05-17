import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import { toast } from 'react-toastify';
import { useSettings } from '../../../context/SettingsContext';
import { useRouter } from 'next/router';

const API_ROOT = '/api';

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState({});
  const { getSetting, loading: settingsLoading } = useSettings();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null); // Store current user object
  const [assignableUsers, setAssignableUsers] = useState([]); // For dropdown
  const [isAssigning, setIsAssigning] = useState({}); // For loading state per submission

  useEffect(() => {
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required');
      router.push('/admin/login');
      return; // Stop execution if no token
    }

    setLoading(true);
    // Fetch current user first
    fetch(`${API_ROOT}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) return Promise.reject('Failed to fetch current user details');
        return res.json();
      })
      .then(userData => {
        setCurrentUser(userData);

        // Decide whether to fetch all users based on role
        let fetchUsersListPromise;
        if (userData.role === 'admin' || userData.role === 'manager') {
          fetchUsersListPromise = fetch(`${API_ROOT}/users/`, { headers: { Authorization: `Bearer ${token}` } })
                                    .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch users for assignment'));
        } else {
          fetchUsersListPromise = Promise.resolve([]); // Staff don't need to assign, resolve with empty array
        }

        return fetchUsersListPromise.then(usersList => {
          setAssignableUsers(usersList.filter(u => u.role === 'staff' || u.role === 'manager' || u.role === 'admin'));
          
          // Proceed with access checks and fetching submissions
          if (!settingsLoading) {
            if ((userData.role === 'staff' || userData.role === 'manager') && !getSetting('non_admin_can_view_all_contacts')) {
              toast.error("Access Denied: You do not have permission to view contact submissions.");
              router.push('/admin/dashboard');
      setLoading(false);
      return;
    }
            fetchSubmissions(token, userData); 
          }
        });
      })
      .catch(err => {
        console.error("Error in initial data fetch:", err);
        const errorMessage = typeof err === 'string' ? err : (err.message || "Could not load page data.");
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        if (errorMessage.includes('user')) router.push('/admin/login');
      });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading, getSetting, router]); 

  const fetchSubmissions = (token, user) => { 
    setLoading(true);
    fetch(`${API_ROOT}/contact/`, { // Backend already uses current_user from token for filtering
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load submissions');
        return res.json();
      })
      .then(setSubmissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleAssignContact = async (submissionId, assignedToId) => {
    setIsAssigning(prev => ({...prev, [submissionId]: true }));
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required.');
      setIsAssigning(prev => ({...prev, [submissionId]: false }));
      return;
    }

    try {
      const res = await fetch(`${API_ROOT}/contact/${submissionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ assigned_to_id: assignedToId === "" ? null : parseInt(assignedToId) })
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({detail: "Failed to assign contact"}));
        throw new Error(errData.detail);
      }
      toast.success('Contact assignment updated.');
      // Refresh submissions to show updated assignment
      if(currentUser) fetchSubmissions(token, currentUser);
    } catch (err) {
      toast.error(err.message || "Could not update assignment.");
    } finally {
      setIsAssigning(prev => ({...prev, [submissionId]: false }));
    }
  };

  const handleDownloadPdf = async (submissionId) => {
    setPdfLoading(prev => ({ ...prev, [submissionId]: true }));
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) {
      toast.error('Authentication required to download PDF.');
      setPdfLoading(prev => ({ ...prev, [submissionId]: false }));
      return;
    }

    try {
      const res = await fetch(`${API_ROOT}/contact/${submissionId}/pdf`, {
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
                <th className="px-4 py-3">Assigned To</th>
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
                  <td className="px-4 py-2">
                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') ? (
                      <select 
                        value={s.assigned_to_id || ""} 
                        onChange={(e) => handleAssignContact(s.id, e.target.value)}
                        disabled={isAssigning[s.id]}
                        className="bg-gray-700 border border-gray-600 text-white text-xs rounded p-1 focus:ring-accent focus:border-accent disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {assignableUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                      </select>
                    ) : (
                      s.assigned_to?.username || 'N/A'
                    )}
                    {isAssigning[s.id] && <span className='text-xs ml-1'>...</span>}
                  </td>
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
    fetch(`${API_ROOT}/contact/${id}/send-email`, {
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
    fetch(`${API_ROOT}/contact/${id}`, {
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