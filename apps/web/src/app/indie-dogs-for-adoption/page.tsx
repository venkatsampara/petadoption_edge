import type { Metadata } from "next";
import { AdoptionLandingPage, getCategoryMetadata } from "@/components/adoption-landing-page";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    ...getCategoryMetadata("indie-dogs-for-adoption"),
    ...(hasFilters(searchParams) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function IndieDogsForAdoptionPage({ searchParams }: Props) {
  return <AdoptionLandingPage slug="indie-dogs-for-adoption" searchParams={searchParams} />;
}

function hasFilters(searchParams: Props["searchParams"]): boolean {
  return Object.values(searchParams).some((value) => typeof value === "string" && value.trim().length > 0);
}
