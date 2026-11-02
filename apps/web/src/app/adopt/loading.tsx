import { PetGridSkeleton } from "@/components/pet-grid-skeleton";

export default function AdoptLoading() {
  return (
    <div className="page-shell py-16">
      <div className="mb-8 h-10 w-72 animate-pulse rounded bg-[#EAE5DC]" />
      <div className="mb-10 h-24 animate-pulse rounded-3xl bg-[#F0ECE5]" />
      <PetGridSkeleton />
    </div>
  );
}
