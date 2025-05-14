import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AdminLayout({ children, title = 'Admin Panel' }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const [adminUser, setAdminUser] = useState(null); // Optional: store user details

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
          // const userData = await res.json(); // Optional: get user data
          // setAdminUser(userData);
          setIsAuthenticated(true);
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
            {/* Optional: Display adminUser.username if available */}
            <nav className="space-x-4 flex items-center">
              <Link href="/admin/dashboard" className="hover:text-accent">Dashboard</Link>
              <Link href="/admin/properties" className="hover:text-accent">Properties</Link>
              <Link href="/admin/users" className="hover:text-accent">Users</Link>
              <Link href="/admin/team" className="hover:text-accent">Team</Link>
              <Link href="/admin/settings" className="hover:text-accent">Settings</Link>
              <Link href="/admin/appearance" className="hover:text-accent">Appearance</Link>
              <button 
                onClick={handleLogout} 
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
              >
                Logout
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