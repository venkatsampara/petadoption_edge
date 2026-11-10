"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { recommendationPreferences } from "@hyderabad-paws/shared";
import { clearPetSearchHistory, readPetSearchHistory } from "@/lib/pet-search-history";
import type { Pet } from "@/lib/types";
import { PetImage } from "@/components/pet-image";

type RecommendationState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; pets: Pet[]; hasHistory: boolean; area?: string; historyUnavailable: boolean };

export function RecommendedPets({ slug }: { slug: string }) {
  const [state, setState] = useState<RecommendationState>({ status: "loading" });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setState({ status: "loading" });
      let historyUnavailable = false;
      let history: ReturnType<typeof readPetSearchHistory> = [];
      try {
        history = readPetSearchHistory();
      } catch (error) {
        console.warn("Could not read pet search history:", error);
        historyUnavailable = true;
      }

      const preferences = recommendationPreferences(history);
      const params = new URLSearchParams();
      if (preferences.species.length) params.set("species", preferences.species.join(","));
      if (preferences.sizes.length) params.set("sizes", preferences.sizes.join(","));
      if (preferences.area) params.set("area", preferences.area);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
        const response = await fetch(`${apiUrl.replace(/\/+$/, "")}/pets/${encodeURIComponent(slug)}/recommendations?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Recommendations request failed (${response.status})`);
        const body = await response.json() as { data: Pet[]; error: { message: string } | null };
        if (body.error || !Array.isArray(body.data)) throw new Error(body.error?.message ?? "Invalid recommendations response");
        if (!controller.signal.aborted) {
          setState({ status: "ready", pets: body.data, hasHistory: history.length > 0, area: preferences.area, historyUnavailable });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Could not load pet recommendations:", error);
          setState({ status: "error", message: "We couldn’t load recommendations. Please try again." });
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [slug, revision]);

  function clearHistory() {
    try {
      clearPetSearchHistory();
      setRevision((value) => value + 1);
    } catch (error) {
      console.error("Could not clear pet search history:", error);
      setState({ status: "error", message: "We couldn’t clear your search history. Please check your browser settings." });
    }
  }

  return (
    <section aria-labelledby="recommendations-heading" className="min-h-[37rem] rounded-2xl border border-forest/10 bg-surface p-5">
      <h2 id="recommendations-heading" className="font-serif text-xl text-forest">Recommended for you</h2>
      {state.status === "loading" && <p role="status" className="mt-2 text-sm text-muted">Finding pets for you…</p>}
      {state.status === "error" && (
        <div role="alert" className="mt-2 text-sm text-muted">
          <p>{state.message}</p>
          <button type="button" className="mt-2 inline-flex min-h-11 items-center font-bold text-forest underline" onClick={() => setRevision((value) => value + 1)}>Try again</button>
        </div>
      )}
      {state.status === "ready" && (
        <>
          <p className="mt-1 text-sm leading-6 text-muted">
            {state.hasHistory
              ? `Based on your recent searches${state.area ? ` and your selected neighbourhood, ${state.area}` : ""}.`
              : "Based on the pet you’re viewing. Search for pets to personalise this list."}
            {" "}Ordered by adoption enquiries.
          </p>
          {state.historyUnavailable && <p className="mt-2 text-xs text-muted">Your search history is unavailable in this browser.</p>}
          {state.pets.length ? (
            <ul className="mt-4 divide-y divide-forest/10">
              {state.pets.map((pet) => {
                const image = pet.images[0] ?? "/pet-placeholder.svg";
                return (
                  <li key={pet.id}>
                    <Link href={`/pets/${pet.slug}`} className="flex items-center gap-4 rounded-xl py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-image-surface">
                        <PetImage src={image} alt="" fill sizes="64px" className="object-cover object-[center_35%]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg font-semibold text-forest">{pet.name}</h3>
                        <p className="text-sm capitalize text-muted">{pet.breed ?? pet.species} · {pet.area}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : <p className="mt-4 text-sm text-muted">No matching pets are available right now. Try another search or check back later.</p>}
          {(state.hasHistory || state.historyUnavailable) && <button type="button" onClick={clearHistory} className="mt-3 inline-flex min-h-11 items-center text-xs font-bold text-forest underline">Clear saved search history</button>}
        </>
      )}
    </section>
  );
}
