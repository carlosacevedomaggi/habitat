import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Head from 'next/head';
import { toast } from 'react-toastify';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; // Install this

const API_ROOT = '/api';

export default function AdminTeamPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // For persistent page errors
  const router = useRouter();

  const fetchTeamMembers = async () => {
    setLoading(true); setError('');
    // GET /api/team is public, but admin actions will require token passed in headers
    try {
      const res = await fetch(`${API_ROOT}/team/`);
      if (!res.ok) throw new Error(`Failed to fetch team members: ${res.statusText}`);
      const data = await res.json();
      setTeamMembers(data.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)));
    } catch (err) {
      setError(err.message || 'Could not load team members.');
      toast.error(err.message || 'Could not load team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (memberId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este miembro del equipo?')) return;
    const token = localStorage.getItem('habitat_admin_token');
    if (!token) { 
      toast.error('Authentication required.'); 
      router.push('/admin/login'); return; 
    }

    // Optimistic UI update can be tricky with reordering; for now, just refetch or simple filter.
    // Consider adding a per-item loading state if many items can be deleted quickly.

    try {
      const res = await fetch(`${API_ROOT}/team/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Team member deleted successfully.');
        fetchTeamMembers(); // Refresh list from server to ensure order is correct
      } else {
        const errData = await res.json().catch(() => ({ detail: 'Failed to delete team member.' }));
        throw new Error(errData.detail);
      }
    } catch (err) {
      toast.error(err.message || 'Could not delete team member.');
      setError(err.message || 'Could not delete team member.');
    }
  };

  // const onDragEnd = async (result) => {
  //   if (!result.destination) return;
  //   const items = Array.from(teamMembers);
  //   const [reorderedItem] = items.splice(result.source.index, 1);
  //   items.splice(result.destination.index, 0, reorderedItem);
  //   const updatedOrder = items.map((item, index) => ({ id: item.id, order: index }));
  //   setTeamMembers(items.map((item, index) => ({...item, order: index })));
  //   const token = localStorage.getItem('habitat_admin_token');
  //   try {
  //     const res = await fetch(`${API_ROOT}/api/team/reorder`, { 
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  //       body: JSON.stringify({ order_data: updatedOrder }),
  //     });
  //     if (!res.ok) { const errData = await res.json(); throw new Error(errData.detail || 'Failed to reorder'); }
  //     toast.success('Team member order updated!');
  //   } catch (err) {
  //     toast.error(err.message || 'Failed to reorder team members');
  //     fetchTeamMembers(); // Revert optimistic update
  //   }
  // };

  return (
    <AdminLayout title="Manage Team Members">
      <Head>
        <title>Manage Team - Habitat Admin</title>
      </Head>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-accent">Team Members</h1>
          <Link href="/admin/team/new"
            className="bg-accent text-gray-900 hover:bg-opacity-80 px-4 py-2 rounded-md text-sm font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg>
            Add New Member
          </Link>
        </div>
        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">Page Error: {error}</div>}
        {loading && <p className="text-gray-400 text-center">Loading team members...</p>}
        
        {!loading && teamMembers.length === 0 && !error && (
             <p className="text-gray-400 text-center">No team members found. Add one to get started!</p>
        )}

        {/* Placeholder for DragDropContext if you install and uncomment react-beautiful-dnd */}
        {/* <DragDropContext onDragEnd={onDragEnd}> ... </DragDropContext> */}
        <div className="space-y-4">
          {teamMembers.map((member, index) => (
            // Replace with Draggable if using react-beautiful-dnd
            <div key={member.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                {/* Drag handle icon - conditionally render if using dnd */}
                {/* <span {...(providedDrag ? providedDrag.dragHandleProps : {})}><i className="fas fa-grip-vertical text-gray-500 hover:text-accent cursor-grab mr-2"></i></span> */}
                {member.image_url && <img src={member.image_url} alt={member.name} className="w-16 h-16 rounded-full object-cover"/>}
                {!member.image_url && <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-accent"><i className="fas fa-user fa-2x"></i></div>}
                <div>
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-gray-400">{member.position}</p>
                  <p className="text-xs text-gray-500">Order: {member.order ?? index}</p>
                </div>
              </div>
              <div className="space-x-2 whitespace-nowrap">
                <Link href={`/admin/team/edit/${member.id}`}
                  className="text-blue-400 hover:text-blue-300 py-1 px-2 rounded hover:bg-blue-500/20">
                  <i className="fas fa-edit"></i> Edit
                </Link>
                <button 
                  onClick={() => handleDelete(member.id)}
                  className="text-red-400 hover:text-red-300 py-1 px-2 rounded hover:bg-red-500/20">
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
} 