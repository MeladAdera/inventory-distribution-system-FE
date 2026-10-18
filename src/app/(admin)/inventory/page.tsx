import { Suspense } from 'react';
import { InventoryPage } from '@/features/admin/inventory/InventoryPage';

export default function Page() {
  // The low-stock deep link lives in `?product=`, so the page reads
  // useSearchParams. Next requires that to sit under a Suspense boundary.
  return (
    <Suspense>
      <InventoryPage />
    </Suspense>
  );
}
