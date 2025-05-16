import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AdminLayout({ children, title = 'Admin Panel' }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null); // Store full user details including role

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('habitat_admin_token');
      if (!token) {
        router.push('/admin/login');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_ROOT}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          // If user is not admin or manager, deny access
          if (!['admin', 'manager', 'staff'].includes(userData?.role)) { // Modified to include staff initially, page-level restrictions will apply
            console.warn('Non-authorized user role attempted to access admin panel');
            router.push('/'); // Redirect to home or another page
            return;
          }
          setAdminUser(userData); // Store user data, including role
          setIsAuthenticated(true);

          // Role-based redirection for specific admin pages
          const adminOnlyPaths = ['/admin/users', '/admin/team', '/admin/settings', '/admin/appearance'];
          if ((userData.role === 'manager' || userData.role === 'staff') && adminOnlyPaths.some(path => router.pathname.startsWith(path))) {
            console.warn(`User role "${userData.role}" attempted to access admin-only path: ${router.pathname}`);
            router.push('/admin/dashboard'); // Or /admin/properties or /admin/contacts
            return;
          }

        } else {
          localStorage.removeItem('habitat_admin_token');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('habitat_admin_token');
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('habitat_admin_token');
    // setAdminUser(null); // Clear user data if stored
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading admin panel...
      </div>
    );
  }

  if (!isAuthenticated) {
    // This case is primarily for the initial render before useEffect runs and redirects.
    // Or if somehow redirect hasn't completed.
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            Verifying authentication... Please wait.
        </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title} - Habitat Admin</title>
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-900 text-white">
        <header className="bg-gray-800 shadow-md">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/admin/dashboard" className="text-xl font-bold text-accent hover:text-opacity-80">
                Habitat Admin
            </Link>
            {adminUser && <span className="text-sm text-gray-400">Bienvenido, {adminUser.username} ({adminUser.role})</span>}
            <nav className="space-x-4 flex items-center">
              <Link href="/admin/dashboard" className="hover:text-accent">Dashboard</Link>
              {(adminUser?.role === 'admin' || adminUser?.role === 'manager' || adminUser?.role === 'staff') && (
                <>
                  <Link href="/admin/properties" className="hover:text-accent">Propiedades</Link>
                  <Link href="/admin/contacts" className="hover:text-accent">Contactos</Link>
                </>
              )}
              {adminUser?.role === 'admin' && (
                <>
                  <Link href="/admin/users" className="hover:text-accent">Usuarios</Link>
                  <Link href="/admin/team" className="hover:text-accent">Equipo</Link>
                  <Link href="/admin/settings" className="hover:text-accent">Ajustes</Link>
                  <Link href="/admin/appearance" className="hover:text-accent">Apariencia</Link>
                </>
              )}
              <button 
                onClick={handleLogout} 
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
              >
                Salir
              </button>
            </nav>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-800 text-center py-4 text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Habitat Admin Panel
        </footer>
      </div>
    </>
  );
} 