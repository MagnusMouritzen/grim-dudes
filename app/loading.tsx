export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-40 bg-ink-800 rounded shimmer" />
        <div className="h-12 w-64 bg-ink-800 rounded shimmer" />
        <div className="h-3 w-80 bg-ink-800 rounded shimmer" />
      </div>
      <div className="grim-divider" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grim-card shimmer p-4 h-40">
            <div className="h-5 w-2/3 bg-ink-900/80 rounded mb-3" />
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }).map((__, j) => (
                <div key={j} className="h-10 bg-ink-900/70 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
