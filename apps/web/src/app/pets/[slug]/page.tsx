import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Heart, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { getWhatsAppLink } from "@hyderabad-paws/shared";
import { ApiRequestError, getPet } from "@/lib/api";
import { ApplicationForm } from "@/components/application-form";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";

type RouteParams = { slug: string };

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  try {
    const pet = await getPet(params.slug);
    const title = `${pet.name} — ${pet.breed ?? pet.species} for Adoption in ${pet.area}`;
    return {
      title,
      description: `${pet.name} is looking for a loving home in ${pet.area}, Hyderabad. ${pet.description.slice(0, 120)}`,
      alternates: { canonical: `/pets/${pet.slug}` },
      openGraph: {
        title: `${pet.name} is waiting to meet you`,
        description: `${pet.breed ?? pet.species} available for adoption in ${pet.area}, Hyderabad.`,
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
  const age =
    pet.ageMonths === null
      ? "Age not known"
      : pet.ageMonths < 12
        ? `${pet.ageMonths} months old`
        : `${Math.floor(pet.ageMonths / 12)} ${Math.floor(pet.ageMonths / 12) === 1 ? "year" : "years"}${pet.ageMonths % 12 ? `, ${pet.ageMonths % 12} months` : ""} old`;

  return (
    <div className="page-shell pb-24 pt-8 sm:pb-16 sm:pt-12">
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

      <Link href="/adopt" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-forest hover:text-[#B97519]">
        <ArrowLeft size={16} aria-hidden="true" /> All adoptable pets
      </Link>

      <div className="mt-6 grid items-start gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="grid gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F0E9DD]">
            <Image
              src={gallery[0]}
              alt={`${pet.name}, an adoptable ${pet.breed ?? pet.species} in ${pet.area}`}
              fill
              priority
              unoptimized={gallery[0].startsWith("http")}
              sizes="(max-width: 1024px) 100vw, 56vw"
              className="object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {gallery.slice(1, 4).map((image, index) => (
                <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F0E9DD]">
                  <Image
                    src={image}
                    alt={`${pet.name}, photo ${index + 2}`}
                    fill
                    unoptimized={image.startsWith("http")}
                    sizes="(max-width: 1024px) 32vw, 18vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          {whatsappLink && (
            <section aria-labelledby="whatsapp-heading" className="rounded-2xl bg-[#E9F0EA] p-5">
              <h2 id="whatsapp-heading" className="font-serif text-xl text-forest">Have a question about {pet.name}?</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Chat directly with their owner or caretaker on WhatsApp.</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="button button-outline mt-3 w-full" aria-label={`Chat on WhatsApp about ${pet.name} (opens in a new tab)`}>
                <MessageCircle size={18} aria-hidden="true" /> Chat on WhatsApp
              </a>
              <p className="mt-2 text-xs leading-5 text-muted">WhatsApp opens with a suggested message; you choose whether to send it.</p>
            </section>
          )}
        </div>

        <article className="lg:sticky lg:top-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F0EA] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-forest">
            <Heart size={14} aria-hidden="true" /> Looking for a home
          </span>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-forest sm:text-6xl">{pet.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-base font-semibold text-muted">
            <MapPin size={18} aria-hidden="true" /> {pet.area}, Hyderabad
          </p>
          <p className="mt-6 text-lg leading-8 text-[#414B44]">{pet.description}</p>

          <dl className="mt-8 grid grid-cols-2 gap-3">
            <ProfileItem label="Breed" value={pet.breed ?? "Indie / mixed"} />
            <ProfileItem label="Age" value={age} />
            <ProfileItem label="Gender" value={pet.gender ?? "Not known"} />
            <ProfileItem label="Size" value={pet.size ?? "Not listed"} />
          </dl>

          <div className="mt-6 space-y-3 rounded-2xl bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <ShieldCheck size={18} aria-hidden="true" />
              {pet.vaccinated ? "Vaccinated" : "Vaccination details to be confirmed"}
            </p>
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <Check size={18} aria-hidden="true" />
              {pet.sterilized ? "Sterilized" : "Sterilization details to be confirmed"}
            </p>
          </div>

          <div id="apply" className="mt-7 rounded-3xl bg-[#E9F0EA] p-5 sm:p-6">
            <h2 className="font-serif text-2xl text-forest">Could you be their person?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Share a little about your home and we&apos;ll help you take the next step.</p>
            <a href="#apply-form" className="button mt-5 w-full">
              Apply to adopt {pet.name} <Heart size={17} aria-hidden="true" />
            </a>
            <div id="apply-form">
              <ApplicationForm pet={pet} />
            </div>
          </div>
        </article>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-forest/10 bg-canvas/95 p-3 backdrop-blur sm:hidden">
        <a href="#apply-form" className="button w-full">
          Apply to adopt {pet.name} <Heart size={17} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-semibold capitalize text-ink">{value}</dd>
    </div>
  );
}
