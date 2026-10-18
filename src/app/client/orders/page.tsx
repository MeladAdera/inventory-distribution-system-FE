import { Suspense } from 'react';
import { ClientOrdersPage } from '@/features/shop/components/ClientOrdersPage';

export default function Page() {
  // The order deep link lives in `?order=`, so the page reads useSearchParams.
  // Next requires that to sit under a Suspense boundary.
  return (
    <Suspense>
      <ClientOrdersPage />
    </Suspense>
  );
}
