import { Button } from '@/common/components';

export default function LoginPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
      <p className="mt-2 text-gray-600">Sign in to your account to get started</p>
      <form className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="••••••••"
          />
        </div>
        <Button variant="default" className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
