export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-page px-4 py-10">
      {/* soft background glow, same treatment as the landing hero */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 inset-s-1/4 h-96 w-96 rounded-full bg-amber-100 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 inset-e-0 h-80 w-80 rounded-full bg-sand-200 opacity-60 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
