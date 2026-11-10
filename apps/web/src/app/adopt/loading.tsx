import { PetGridSkeleton } from "@/components/pet-grid-skeleton";

export default function AdoptLoading() {
  return (
    <div className="public-theme page-shell py-16">
      <div className="mb-8 h-10 w-72 animate-pulse rounded bg-soft" />
      <div className="mb-10 h-24 animate-pulse rounded-3xl bg-soft" />
      <PetGridSkeleton />
    </div>
  );
}
