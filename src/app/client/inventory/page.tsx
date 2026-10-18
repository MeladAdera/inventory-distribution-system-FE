import { Suspense } from 'react';
import { ClientInventoryPage } from '@/features/shop/components/ClientInventoryPage';

export default function Page() {
  // The low-stock deep link lives in `?product=`, so the page reads
  // useSearchParams. Next requires that to sit under a Suspense boundary.
  return (
    <Suspense>
      <ClientInventoryPage />
    </Suspense>
  );
}
