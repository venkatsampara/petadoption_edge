import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Pet } from "@/lib/types";
import { PetImage } from "@/components/pet-image";

function ageLabel(ageMonths: number | null): string {
  if (ageMonths === null) return "Age unknown";
  if (ageMonths < 12) return `${ageMonths} months`;
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months ? `${years} yr ${months} mo` : `${years} ${years === 1 ? "year" : "years"}`;
}

export function PetCard({ pet }: { pet: Pet }) {
  const image = pet.images[0] ?? "/pet-placeholder.svg";
  return (
    <article className="pet-card group overflow-hidden rounded-2xl bg-surface shadow-card">
      <Link
        href={`/pets/${pet.slug}`}
        className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
        aria-label={`Meet ${pet.name}, ${pet.breed ?? pet.species} in ${pet.area}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-image-surface">
          <PetImage
            src={image}
            alt={`${pet.name}, an adoptable ${pet.breed ?? pet.species} in ${pet.area}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-[center_35%] transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="absolute left-4 top-4 rounded-full bg-surface/95 px-3 py-1 text-xs font-bold capitalize text-forest">
            {pet.species}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl font-semibold leading-tight text-ink">{pet.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {pet.breed ?? "Lovely companion"} <span aria-hidden="true">·</span> {ageLabel(pet.ageMonths)}
              </p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-soft text-forest transition-colors group-hover:bg-forest-strong group-hover:text-white">
              <ArrowUpRight size={18} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-muted">
            <MapPin size={15} aria-hidden="true" /> {pet.area}, Hyderabad
          </p>
        </div>
      </Link>
    </article>
  );
}
