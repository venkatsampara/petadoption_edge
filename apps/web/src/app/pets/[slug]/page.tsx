import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Heart, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { getWhatsAppLink } from "@hyderabad-paws/shared";
import { ApiRequestError, getPet, getPets } from "@/lib/api";
import { ApplicationForm } from "@/components/application-form";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { PetCard } from "@/components/pet-card";
import { PetGallery } from "@/components/pet-gallery";
import { RecommendedPets } from "@/components/recommended-pets";
import type { Pet } from "@/lib/types";

type RouteParams = { slug: string };

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  try {
    const pet = await getPet(params.slug);
    const status = pet.status === "adopted"
      ? "Adopted"
      : pet.status === "pending"
        ? "Adoption in Progress"
        : "For Adoption";
    const title = `${pet.name} — ${pet.breed ?? pet.species} ${status} in ${pet.area}`;
    return {
      title,
      description: pet.status === "adopted"
        ? `${pet.name} has found a home. Discover other adoptable pets in ${pet.area}, Hyderabad.`
        : `${pet.name} is looking for a loving home in ${pet.area}, Hyderabad. ${pet.description.slice(0, 120)}`,
      alternates: { canonical: `/pets/${pet.slug}` },
      openGraph: {
        title: pet.status === "adopted" ? `${pet.name} has found a home` : `${pet.name} is waiting to meet you`,
        description: pet.status === "adopted"
          ? `Meet other adoptable ${pet.species} in ${pet.area}, Hyderabad.`
          : `${pet.breed ?? pet.species} available for adoption in ${pet.area}, Hyderabad.`,
        images: pet.images[0] ? [pet.images[0]] : ["/pet-placeholder.svg"],
      },
    };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return {};
    throw error;
  }
}

export default async function PetDetailPage({ params }: { params: RouteParams }) {
  let pet;
  try {
    pet = await getPet(params.slug);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const gallery = pet.images.length > 0 ? pet.images : ["/pet-placeholder.svg"];
  const whatsappLink = pet.status === "available" ? getWhatsAppLink(pet.whatsappNumber, pet.name) : null;
  const similarPetsHref = `/adopt?species=${encodeURIComponent(pet.species)}`;
  const similarSpeciesLabel = pet.species === "other" ? "pets" : `${pet.species}s`;
  let similarPets: Pet[] = [];
  let similarPetsUnavailable = false;
  if (pet.status !== "available") {
    try {
      const result = await getPets(new URLSearchParams({
        species: pet.species,
        status: "available",
        limit: "4",
        page: "1",
      }));
      similarPets = result.items.filter((similarPet) => similarPet.id !== pet.id).slice(0, 3);
    } catch (error) {
      if (!(error instanceof ApiRequestError)) throw error;
      similarPetsUnavailable = true;
    }
  }
  const age =
    pet.ageMonths === null
      ? "Age not known"
      : pet.ageMonths < 12
        ? `${pet.ageMonths} months old`
        : `${Math.floor(pet.ageMonths / 12)} ${Math.floor(pet.ageMonths / 12) === 1 ? "year" : "years"}${pet.ageMonths % 12 ? `, ${pet.ageMonths % 12} months` : ""} old`;

  return (
    <div className="public-theme page-shell pb-24 pt-8 sm:pb-16 sm:pt-12">
      <BreadcrumbJsonLd items={[
        { name: "Home", path: "/" },
        { name: "Adopt", path: "/adopt" },
        { name: pet.name, path: `/pets/${pet.slug}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: pet.name,
        image: pet.images,
        description: pet.description,
        brand: { "@type": "Organization", name: "Hyderabad Paws" },
        offers: {
          "@type": "Offer",
          availability: pet.status === "available"
            ? "https://schema.org/InStock"
            : pet.status === "pending"
              ? "https://schema.org/LimitedAvailability"
              : "https://schema.org/SoldOut",
          url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/pets/${pet.slug}`,
          price: "0",
          priceCurrency: "INR",
        },
        mainEntityOfPage: { "@type": "ItemPage", "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/pets/${pet.slug}` },
      }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li><Link className="hover:text-forest" href="/">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link className="hover:text-forest" href="/adopt">Adopt</Link></li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-forest" aria-current="page">{pet.name}</li>
        </ol>
      </nav>

      <Link href="/adopt" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest hover:text-eyebrow">
        <ArrowLeft size={16} aria-hidden="true" /> All adoptable pets
      </Link>

      <section className="mt-5 rounded-2xl bg-surface p-5 lg:hidden" aria-label={`${pet.name} adoption details`}>
        <span className="inline-flex rounded-full bg-soft px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-forest">
          {statusLabel(pet.status)}
        </span>
        <h1 className="fluid-display mt-3 font-serif font-semibold text-forest">{pet.name}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{pet.area}, Hyderabad</p>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="button mt-4 w-full"
            aria-label={`Chat on WhatsApp about ${pet.name} (opens in a new tab)`}
          >
            <MessageCircle size={18} aria-hidden="true" /> Chat on WhatsApp
          </a>
        ) : pet.status === "available" ? (
          <a href="#apply-form" className="button mt-4 w-full">
            Apply to adopt {pet.name} <Heart size={17} aria-hidden="true" />
          </a>
        ) : (
          <Link href={similarPetsHref} className="button mt-4 w-full">
            Browse similar pets
          </Link>
        )}
      </section>

      <div className="mt-6 grid items-start gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="grid gap-3">
          <PetGallery
            images={gallery}
            petName={pet.name}
            petDescription={`${pet.breed ?? pet.species} in ${pet.area}`}
          />
          <RecommendedPets slug={pet.slug} />
        </div>

        <article className="lg:sticky lg:top-28">
          <div className="hidden lg:block">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-forest">
              <Heart size={14} aria-hidden="true" /> {statusLabel(pet.status)}
            </span>
            <h1 className="fluid-display mt-4 font-serif font-semibold text-forest">{pet.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-base font-semibold text-muted">
              <MapPin size={18} aria-hidden="true" /> {pet.area}, Hyderabad
            </p>
          </div>
          {whatsappLink && (
            <section aria-labelledby="whatsapp-heading" className="mt-5 hidden rounded-2xl bg-soft p-5 lg:block">
              <h2 id="whatsapp-heading" className="font-serif text-xl text-forest">Have a question about {pet.name}?</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Chat directly with their owner or caretaker on WhatsApp.</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="button mt-3 w-full" aria-label={`Chat on WhatsApp about ${pet.name} (opens in a new tab)`}>
                <MessageCircle size={18} aria-hidden="true" /> Chat on WhatsApp
              </a>
              <p className="mt-2 text-xs leading-5 text-muted">WhatsApp opens with a suggested message; you choose whether to send it.</p>
            </section>
          )}
          {pet.status !== "available" && (
            <div role="status" className="mt-5 rounded-2xl bg-soft p-5">
              <h2 className="font-serif text-xl text-forest">
                {pet.status === "adopted" ? `${pet.name} has found a home` : "An adoption is in progress"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {pet.status === "adopted"
                  ? "You can still meet another pet looking for a family."
                  : "You can browse other pets while this adoption is underway."}
              </p>
              <Link href={similarPetsHref} className="button button-outline mt-4">Browse similar pets</Link>
            </div>
          )}
          <p className="mt-6 text-lg leading-8 text-ink">{pet.description}</p>

          <dl className="mt-8 grid grid-cols-2 gap-3">
            <ProfileItem label="Breed" value={pet.breed ?? "Indie / mixed"} />
            <ProfileItem label="Age" value={age} />
            <ProfileItem label="Gender" value={pet.gender ?? "Not known"} />
            <ProfileItem label="Size" value={pet.size ?? "Not listed"} />
          </dl>

          <div className="mt-6 space-y-3 rounded-2xl bg-surface p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <ShieldCheck size={18} aria-hidden="true" />
              {pet.vaccinated ? "Vaccinated" : "Vaccination details to be confirmed"}
            </p>
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <Check size={18} aria-hidden="true" />
              {pet.sterilized ? "Sterilized" : "Sterilization details to be confirmed"}
            </p>
          </div>

          {pet.status !== "available" && (
            <section className="mt-10" aria-labelledby="similar-pets-heading">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-forest">More friends to meet</p>
                  <h2 id="similar-pets-heading" className="mt-1 font-serif text-2xl text-ink">
                    Other {similarSpeciesLabel} looking for a home
                  </h2>
                </div>
                <Link href={similarPetsHref} className="button button-outline">
                  Browse all {similarSpeciesLabel}
                </Link>
              </div>
              {similarPetsUnavailable ? (
                <p role="status" className="rounded-2xl bg-surface p-5 text-sm leading-6 text-muted">
                  We couldn’t load similar pets right now. You can still browse all available {similarSpeciesLabel}.
                </p>
              ) : similarPets.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {similarPets.map((similarPet) => <PetCard key={similarPet.id} pet={similarPet} />)}
                </div>
              ) : (
                <p className="rounded-2xl bg-surface p-5 text-sm leading-6 text-muted">
                  No similar pets are listed right now. Browse all available {similarSpeciesLabel} to see what’s new.
                </p>
              )}
            </section>
          )}

          {pet.status === "available" && (
            <div id="apply" className="mt-7 rounded-3xl bg-soft p-5 sm:p-6">
              <h2 className="font-serif text-2xl text-forest">Could you be their person?</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Share a little about your home and we&apos;ll help you take the next step.</p>
              <a href="#apply-form" className="button button-outline mt-5 w-full">
                Apply to adopt {pet.name} <Heart size={17} aria-hidden="true" />
              </a>
              <div id="apply-form" className="scroll-mt-24">
                <ApplicationForm pet={pet} />
              </div>
            </div>
          )}
        </article>
      </div>

      {pet.status === "available" && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-forest/10 bg-canvas/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
          {whatsappLink ? (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="button w-full" aria-label={`Chat on WhatsApp about ${pet.name} (opens in a new tab)`}>
              <MessageCircle size={18} aria-hidden="true" /> Chat on WhatsApp
            </a>
          ) : (
            <a href="#apply-form" className="button w-full">
              Apply to adopt {pet.name} <Heart size={17} aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-surface px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-semibold capitalize text-ink">{value}</dd>
    </div>
  );
}

function statusLabel(status: "available" | "pending" | "adopted"): string {
  if (status === "pending") return "Adoption in progress";
  if (status === "adopted") return "Adopted";
  return "Looking for a home";
}
