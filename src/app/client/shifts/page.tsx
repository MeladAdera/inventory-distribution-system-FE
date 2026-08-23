import { Suspense } from 'react';
import { ShiftsPage } from '@/features/shop/shifts/components/ShiftsPage';

export default function Page() {
  // The tab lives in `?tab=`, so the page reads useSearchParams. Next requires
  // that to sit under a Suspense boundary or the static build bails out.
  return (
    <Suspense>
      <ShiftsPage />
    </Suspense>
  );
}
