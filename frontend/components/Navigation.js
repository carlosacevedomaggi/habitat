// Placeholder for Navigation Component
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Navigation() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('habitat_admin_token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('habitat_admin_token');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <nav className="space-x-4">
      {[
        { href: '/', label: 'Inicio' },
        { href: '/properties', label: 'Propiedades' },
        { href: '/about', label: 'Nosotros' },
        { href: '/contact', label: 'Contacto' },
      ].map((item) => (
        <Link key={item.href} href={item.href} className="text-gray-700 hover:text-primary">
          {item.label}
        </Link>
      ))}
      {isLoggedIn ? (
        <>
          <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary">
            Admin
          </Link>
          <button onClick={handleLogout} className="text-gray-700 hover:text-primary">
            Salir
          </button>
        </>
      ) : (
        <Link href="/admin/login" className="text-gray-700 hover:text-primary">
          Admin
        </Link>
      )}
    </nav>
  );
} 