import { SuppliersPage } from '@/features/shared/suppliers';

// The same page the shop owner gets at /client/suppliers. The warehouse has its
// own suppliers — the distribution centers it buys from — and the API scopes
// every call to the caller's own shop, so there is nothing to vary here.
export default function Page() {
  return <SuppliersPage />;
}
