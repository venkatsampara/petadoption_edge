type ApiResponse<T> = {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
};

export class AdminApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AdminApiError";
  }
}

export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new AdminApiError(error instanceof Error ? error.message : "Unable to reach the API", 503);
  }

  const result = await response.json() as ApiResponse<T>;
  if (!response.ok || result.error || result.data === null) {
    throw new AdminApiError(result.error?.message ?? "The API request failed", response.status);
  }
  return result.data;
}

export type AdminApplication = {
  id: string;
  petId: string | null;
  applicantName: string;
  email: string;
  phone: string;
  area: string;
  message: string;
  housingType: string;
  status: "new" | "reviewing" | "approved" | "rejected";
  createdAt: string;
  pet: { id: string; slug: string; name: string } | null;
};
