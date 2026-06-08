export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">IDS</h1>
        </div>
        <nav className="mt-8 space-y-4 px-6">
          <a href="/dashboard" className="block text-gray-700 hover:text-blue-600">
            Dashboard
          </a>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
