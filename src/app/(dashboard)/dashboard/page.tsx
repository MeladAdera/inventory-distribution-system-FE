'use client';

import { Button } from '@/common/components';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to the Inventory Distribution System</p>
      <div className="mt-8 space-x-4">
        <Button variant="default">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  );
}
