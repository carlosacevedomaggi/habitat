// Placeholder for Navigation Component
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="space-x-4">
      {[
        { href: '/', label: 'Home' },
        { href: '/properties', label: 'Properties' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
      ].map((item) => (
        <Link key={item.href} href={item.href} className="text-gray-700 hover:text-primary">
          {item.label}
        </Link>
      ))}
      {/* TODO: show only if logged in as admin */}
      <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary">
        Admin
      </Link>
    </nav>
  );
} 