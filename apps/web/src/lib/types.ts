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
  createdAt: string;
  updatedAt: string;
};

export type PetListResponse = {
  items: Pet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
