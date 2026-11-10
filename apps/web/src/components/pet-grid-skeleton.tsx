export function PetGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true">
      <span className="sr-only">Loading pets</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-2xl bg-surface shadow-card">
          <div className="aspect-[4/3] bg-image-surface" />
          <div className="space-y-3 p-5">
            <div className="h-6 w-1/2 rounded bg-soft" />
            <div className="h-4 w-2/3 rounded bg-soft" />
            <div className="h-4 w-1/3 rounded bg-soft" />
          </div>
        </div>
      ))}
    </div>
  );
}
