import { addPetSearch, petSearchHistorySchema, petSearchSchema, type PetSearch } from "@hyderabad-paws/shared";

const HISTORY_KEY = "hyderabad-paws-pet-searches";

export function readPetSearchHistory(): PetSearch[] {
  const value = window.localStorage.getItem(HISTORY_KEY);
  if (!value) return [];
  return petSearchHistorySchema.parse(JSON.parse(value));
}

export function savePetSearch(search: PetSearch): void {
  const parsed = petSearchSchema.parse(search);
  if (!parsed.species && !parsed.size && !parsed.area) return;
  const history = addPetSearch(readPetSearchHistory(), parsed);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearPetSearchHistory(): void {
  window.localStorage.removeItem(HISTORY_KEY);
}
