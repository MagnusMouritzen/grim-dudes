export default function Loading() {
  return (
    <div
      className="space-y-6 grim-page motion-safe:animate-fade-in"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <h1 className="sr-only">Loading bestiary</h1>
      <div className="space-y-3" aria-hidden="true">
        <div className="h-3 w-40 rounded shimmer bg-ink-800 ring-1 ring-stone-800/40" />
        <div className="h-12 w-64 rounded shimmer bg-ink-800 ring-1 ring-stone-800/40" />
        <div className="h-3 w-80 rounded shimmer bg-ink-800 ring-1 ring-stone-800/40" />
      </div>
      <div className="grim-divider" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grim-card shimmer p-4 h-40 motion-safe:animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="h-5 w-2/3 rounded mb-3 bg-ink-900/85 ring-1 ring-stone-800/35" />
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }).map((__, j) => (
                <div key={j} className="h-10 rounded bg-ink-900/75 ring-1 ring-stone-800/30" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
