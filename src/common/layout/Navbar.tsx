import { Button } from '@/common/components';
import { useAuth } from '@/features/auth';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-gray-900">IDS</div>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-600">{user.name}</span>}
          <Button size="sm" variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
