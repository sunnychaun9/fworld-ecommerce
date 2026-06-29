/**
 * Placeholder landing page.
 *
 * This exists only so the Next.js app compiles and builds as part of the
 * repository foundation. The real storefront is implemented in later phases
 * per docs/002_PRD.md and docs/007_UI_UX.md.
 */
export default function HomePage(): React.ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">FWorld</h1>
      <p className="text-sm text-neutral-500">
        Premium Indian D2C fashion platform — repository foundation is ready.
      </p>
    </main>
  );
}
