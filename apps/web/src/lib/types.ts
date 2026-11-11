export type Pet = {
  id: string;
  slug: string;
  name: string;
  species: "dog" | "cat" | "other";
  breed: string | null;
  ageMonths: number | null;
  gender: "male" | "female" | null;
  size: "small" | "medium" | "large" | null;
  area: string;
  description: string;
  vaccinated: boolean;
  sterilized: boolean;
  status: "available" | "pending" | "adopted";
  images: string[];
  whatsappNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedPet = Omit<Pet, "status"> & { status: Pet["status"] | "hidden" };

export type PetListResponse = {
  items: Pet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
