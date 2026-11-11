import type { Metadata } from "next";
import { AdoptionLandingPage, getCategoryMetadata } from "@/components/adoption-landing-page";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    ...getCategoryMetadata("dogs-for-adoption"),
    ...(hasFilters(searchParams) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function DogsForAdoptionPage({ searchParams }: Props) {
  return <AdoptionLandingPage slug="dogs-for-adoption" searchParams={searchParams} />;
}

function hasFilters(searchParams: Props["searchParams"]): boolean {
  return Object.values(searchParams).some((value) => typeof value === "string" && value.trim().length > 0);
}
