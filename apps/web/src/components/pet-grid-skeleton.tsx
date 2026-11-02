export function PetGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading pets">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="aspect-[4/3] bg-[#EAE5DC]" />
          <div className="space-y-3 p-5">
            <div className="h-6 w-1/2 rounded bg-[#EAE5DC]" />
            <div className="h-4 w-2/3 rounded bg-[#F0ECE5]" />
            <div className="h-4 w-1/3 rounded bg-[#F0ECE5]" />
          </div>
        </div>
      ))}
    </div>
  );
}
