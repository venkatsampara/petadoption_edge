"use client";

import { useEffect } from "react";
import { petSearchSchema } from "@hyderabad-paws/shared";
import { savePetSearch } from "@/lib/pet-search-history";

export function RecordPetSearch({ species, area, size }: { species?: string; area?: string; size?: string }) {
  useEffect(() => {
    const parsed = petSearchSchema.safeParse({
      species: species || undefined,
      area: area || undefined,
      size: size || undefined,
    });
    if (!parsed.success) return;
    try {
      savePetSearch(parsed.data);
    } catch (error) {
      console.warn("Could not save pet search history:", error);
    }
  }, [species, area, size]);

  return null;
}
