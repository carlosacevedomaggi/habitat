import AdminLayout from '../../components/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_ROOT = '/api';

// Placeholder for Admin Dashboard Page
export default function AdminDashboardPage() {
  const [userRole, setUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('habitat_admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }
      try {
        const res = await fetch(`${API_ROOT}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setUserRole(userData.role);
        } else {
          localStorage.removeItem('habitat_admin_token');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        localStorage.removeItem('habitat_admin_token');
        router.push('/admin/login');
      } finally {
        setLoadingRole(false);
      }
    };
    fetchUserRole();
  }, [router]);

  if (loadingRole) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-center py-10">Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <Head>
        {/* Overwrite the default title from AdminLayout if needed, or add other specific head elements */}
        <title>Admin Dashboard - Habitat</title>
      </Head>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-accent mb-6">Admin Dashboard</h1>
        <p className="text-gray-300 mb-4">
          Welcome to the Habitat Admin Panel. From here, you can manage properties, users, team members, and site settings.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards for different sections - to be linked later */}
          {(userRole === 'admin' || userRole === 'manager' || userRole === 'staff') && (
            <Link
              href="/admin/properties"
              className="bg-gray-700 p-6 rounded-lg hover:shadow-accent/20 shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold text-accent mb-2">Manage Properties</h2>
              <p className="text-gray-400 text-sm">View, add, edit, and delete property listings.</p>
            </Link>
          )}
          {userRole === 'admin' && (
            <Link
              href="/admin/users"
              className="bg-gray-700 p-6 rounded-lg hover:shadow-accent/20 shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold text-accent mb-2">Manage Users</h2>
              <p className="text-gray-400 text-sm">Administer user accounts and roles.</p>
            </Link>
          )}
          {userRole === 'admin' && (
            <Link
              href="/admin/team"
              className="bg-gray-700 p-6 rounded-lg hover:shadow-accent/20 shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold text-accent mb-2">Team Members</h2>
              <p className="text-gray-400 text-sm">Update your team information.</p>
            </Link>
          )}
          {userRole === 'admin' && (
            <Link
              href="/admin/settings"
              className="bg-gray-700 p-6 rounded-lg hover:shadow-accent/20 shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold text-accent mb-2">Site Settings</h2>
              <p className="text-gray-400 text-sm">Configure global site parameters and content.</p>
            </Link>
          )}
          {userRole === 'admin' && (
            <Link
              href="/admin/appearance"
              className="bg-gray-700 p-6 rounded-lg hover:shadow-accent/20 shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold text-accent mb-2">Appearance</h2>
              <p className="text-gray-400 text-sm">Manage homepage background and brand colours.</p>
            </Link>
          )}
          {(userRole === 'admin' || userRole === 'manager' || userRole === 'staff') && (
            <Link
              href="/admin/contacts"
              className="bg-gray-700 p-6 rounded-lg hover:shadow-accent/20 shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold text-accent mb-2">Contact Submissions</h2>
              <p className="text-gray-400 text-sm">Check messages received through contact forms.</p>
            </Link>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 