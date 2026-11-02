import type { Pet, PetListResponse } from "@/lib/types";

type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required to fetch adoption listings");
  }
  return apiUrl.replace(/\/+$/, "");
}

async function apiGet<T>(path: string, revalidate = 300): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new ApiRequestError(
      error instanceof Error ? `Unable to reach the pet API: ${error.message}` : "Unable to reach the pet API",
      503,
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiRequestError("The pet API returned an invalid response", response.status);
  }

  if (!response.ok || envelope.error || envelope.data === null) {
    throw new ApiRequestError(
      envelope.error?.message ?? "The pet API request failed",
      response.status,
    );
  }
  return envelope.data;
}

export function getPets(filters: URLSearchParams = new URLSearchParams()): Promise<PetListResponse> {
  const query = filters.toString();
  return apiGet<PetListResponse>(`/pets${query ? `?${query}` : ""}`);
}

export function getFeaturedPets(): Promise<Pet[]> {
  return apiGet<PetListResponse>("/pets?status=available&limit=6&page=1").then(
    (result) => result.items,
  );
}

export function getPet(slug: string): Promise<Pet> {
  return apiGet<Pet>(`/pets/${encodeURIComponent(slug)}`);
}
