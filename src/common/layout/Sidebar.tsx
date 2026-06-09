import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Orders', href: '/orders' },
  { label: 'Products', href: '/products' },
  { label: 'Shops', href: '/shops' },
  { label: 'Users', href: '/users' },
  { label: 'Audit Logs', href: '/audit-logs' },
  { label: 'Notifications', href: '/notifications' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">IDS</h1>
      </div>
      <nav className="mt-8 space-y-2 px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
